const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_ATTEMPTS = Number(process.env.PRISMA_MIGRATE_MAX_ATTEMPTS || '6');
const BASE_DELAY_MS = Number(process.env.PRISMA_MIGRATE_RETRY_DELAY_MS || '3000');
const MAX_DELAY_MS = Number(process.env.PRISMA_MIGRATE_MAX_DELAY_MS || '20000');

const RETRYABLE_PATTERNS = [
    /P1002/i,
    /P1001/i,
    /advisory lock/i,
    /database server was reached but timed out/i,
    /can't reach database server/i,
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const maskDbUrl = (url) => url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');

const loadEnvFromFileIfMissing = () => {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }

    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) {
            continue;
        }

        const key = trimmed.slice(0, eqIndex).trim();
        if (!key || process.env[key]) {
            continue;
        }

        const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
    }
};

const deriveDirectUrlFromPooler = (url) => {
    if (!url || typeof url !== 'string') {
        return null;
    }

    // Neon pooled URLs include "-pooler" in the hostname. Prisma CLI is more reliable with a direct endpoint.
    if (url.includes('-pooler.')) {
        return url.replace('-pooler.', '.');
    }

    return null;
};

const resolveMigrationUrl = () => {
    const direct = (process.env.DIRECT_URL || '').trim();
    if (direct) {
        return { url: direct, source: 'DIRECT_URL' };
    }

    const fromPooler = deriveDirectUrlFromPooler((process.env.DATABASE_URL || '').trim());
    if (fromPooler) {
        return { url: fromPooler, source: 'DATABASE_URL (derived from Neon pooler host)' };
    }

    return null;
};

const runMigrateDeploy = () =>
    new Promise((resolve) => {
        const isWindows = process.platform === 'win32';
        const command = isWindows ? 'cmd.exe' : 'npx';
        const args = isWindows
            ? ['/d', '/s', '/c', 'npx prisma migrate deploy']
            : ['prisma', 'migrate', 'deploy'];

        const child = spawn(command, args, {
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            output += text;
            process.stdout.write(text);
        });

        child.stderr.on('data', (chunk) => {
            const text = chunk.toString();
            errorOutput += text;
            process.stderr.write(text);
        });

        child.on('error', (error) => {
            const text = error?.message || 'Unknown process error';
            errorOutput += `\n${text}\n`;
            process.stderr.write(`${text}\n`);
            resolve({ code: 1, combinedOutput: `${output}\n${errorOutput}` });
        });

        child.on('close', (code) => {
            resolve({ code: code ?? 1, combinedOutput: `${output}\n${errorOutput}` });
        });
    });

const isRetryable = (text) => RETRYABLE_PATTERNS.some((pattern) => pattern.test(text));

const main = async () => {
    loadEnvFromFileIfMissing();

    const migrationUrl = resolveMigrationUrl();

    if (migrationUrl) {
        process.env.DATABASE_URL = migrationUrl.url;
        console.log(
            `[migrate-retry] Using migration connection from ${migrationUrl.source}: ${maskDbUrl(migrationUrl.url)}`
        );
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 1) {
            console.log(`[migrate-retry] Attempt ${attempt}/${MAX_ATTEMPTS}`);
        }

        const result = await runMigrateDeploy();
        if (result.code === 0) {
            process.exit(0);
        }

        const retryable = isRetryable(result.combinedOutput);
        if (!retryable || attempt === MAX_ATTEMPTS) {
            if (retryable) {
                console.error(
                    `[migrate-retry] Failed after ${MAX_ATTEMPTS} attempts due to repeated transient DB lock/timeout.`
                );
            }
            process.exit(result.code || 1);
        }

        const delayMs = Math.min(BASE_DELAY_MS * attempt, MAX_DELAY_MS);
        console.warn(
            `[migrate-retry] Transient Prisma migration timeout/lock detected. Retrying in ${Math.round(
                delayMs / 1000
            )}s...`
        );
        await sleep(delayMs);
    }
};

void main();
