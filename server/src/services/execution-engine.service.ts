import { Worker } from 'worker_threads';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { SubmissionStatus } from '@prisma/client';
import { ApiError } from '../utils/errors';

export interface ExecutionTestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

export interface ExecutionSummary {
    passedCount: number;
    failedCount: number;
    executionTime: number;
    finalVerdict: SubmissionStatus;
    failedCases: Array<{
        testCaseId: string;
        expectedOutput: string;
        actualOutput: string;
        isHidden: boolean;
    }>;
}

export interface CustomExecutionResult {
    executionTime: number;
    output: string;
    status: SubmissionStatus;
    error: string | null;
}

type NormalizedLanguage = 'javascript' | 'cpp';

interface ProcessExecutionResult {
    ok: boolean;
    stdout: string;
    stderr: string;
    timedOut: boolean;
    exitCode: number | null;
    errorMessage?: string;
}

const LANGUAGE_ALIASES: Record<string, NormalizedLanguage> = {
    javascript: 'javascript',
    js: 'javascript',
    cpp: 'cpp',
    'c++': 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
};

const SUPPORTED_LANGUAGES_MESSAGE = 'Unsupported language. Supported: JavaScript (js) and C++ (cpp).';
const CODE_SIZE_LIMIT = 30_000;
const INPUT_SIZE_LIMIT = 10_000;
const TIME_LIMIT_MS = 2000;
const COMPILE_TIME_LIMIT_MS = 8_000;
const TOOL_DETECTION_TIMEOUT_MS = 1_000;
const MEMORY_LIMIT_MB = 64;
const MAX_ERROR_MESSAGE_LENGTH = 600;

const WORKER_SOURCE = `
const { parentPort } = require('worker_threads');
const vm = require('vm');

parentPort.on('message', ({ code, input, timeoutMs }) => {
  const stdout = [];
  const sandbox = {
    input,
    console: {
      log: (...args) => {
        stdout.push(args.map((item) => String(item)).join(' '));
      },
    },
    require: undefined,
    process: undefined,
    module: undefined,
    exports: undefined,
    Buffer: undefined,
    setInterval: undefined,
    setTimeout: undefined,
  };

  const context = vm.createContext(sandbox, {
    codeGeneration: {
      strings: false,
      wasm: false,
    },
  });
  const wrappedCode = \`
\${code}
if (typeof solve === 'function') {
  const __result = solve(input);
  if (__result !== undefined) {
    console.log(__result);
  }
}
\`;

  try {
    const script = new vm.Script(wrappedCode, { displayErrors: true });
    script.runInContext(context, { timeout: timeoutMs });
    parentPort.postMessage({ ok: true, output: stdout.join('\\n') });
  } catch (error) {
    parentPort.postMessage({
      ok: false,
      error: error && error.message ? String(error.message) : 'Execution error',
    });
  }
});
`;

export class ExecutionEngineService {
    private static cachedCppCompiler: string | null | undefined;

    static async run({
        code,
        language,
        testCases,
    }: {
        code: string;
        language: string;
        testCases: ExecutionTestCase[];
    }): Promise<ExecutionSummary> {
        const normalizedLanguage = this.normalizeLanguage(language);

        const sanitizedCode = this.sanitizeCode(code, normalizedLanguage);
        if (testCases.length === 0) {
            return {
                passedCount: 0,
                failedCount: 0,
                executionTime: 0,
                finalVerdict: SubmissionStatus.ERROR,
                failedCases: [],
            };
        }

        let passedCount = 0;
        let failedCount = 0;
        const failedCases: ExecutionSummary['failedCases'] = [];
        const startedAt = Date.now();

        if (normalizedLanguage === 'javascript') {
            for (const testCase of testCases) {
                const sanitizedInput = this.sanitizeInput(testCase.input);
                const result = await this.executeJavascript({
                    code: sanitizedCode,
                    input: sanitizedInput,
                    timeoutMs: TIME_LIMIT_MS,
                });

                if (!result.ok) {
                    failedCount += 1;
                    failedCases.push({
                        testCaseId: testCase.id,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput: `ERROR: ${result.error}`,
                        isHidden: testCase.isHidden,
                    });
                    continue;
                }

                const expectedOutput = this.normalizeOutput(testCase.expectedOutput);
                const actualOutput = this.normalizeOutput(result.output || '');
                if (actualOutput === expectedOutput) {
                    passedCount += 1;
                } else {
                    failedCount += 1;
                    failedCases.push({
                        testCaseId: testCase.id,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput: result.output || '',
                        isHidden: testCase.isHidden,
                    });
                }
            }
        } else {
            const compilation = await this.compileCppProgram(sanitizedCode);
            if (!compilation.ok) {
                const executionTime = Date.now() - startedAt;
                return {
                    passedCount: 0,
                    failedCount: testCases.length,
                    executionTime,
                    finalVerdict: SubmissionStatus.ERROR,
                    failedCases: testCases.map((testCase) => ({
                        testCaseId: testCase.id,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput: `ERROR: ${compilation.error}`,
                        isHidden: testCase.isHidden,
                    })),
                };
            }

            try {
                for (const testCase of testCases) {
                    const sanitizedInput = this.sanitizeInput(testCase.input);
                    const result = await this.executeCppBinary({
                        executablePath: compilation.executablePath,
                        input: sanitizedInput,
                        timeoutMs: TIME_LIMIT_MS,
                    });

                    if (!result.ok) {
                        failedCount += 1;
                        failedCases.push({
                            testCaseId: testCase.id,
                            expectedOutput: testCase.expectedOutput,
                            actualOutput: `ERROR: ${result.error}`,
                            isHidden: testCase.isHidden,
                        });
                        continue;
                    }

                    const expectedOutput = this.normalizeOutput(testCase.expectedOutput);
                    const actualOutput = this.normalizeOutput(result.output || '');
                    if (actualOutput === expectedOutput) {
                        passedCount += 1;
                    } else {
                        failedCount += 1;
                        failedCases.push({
                            testCaseId: testCase.id,
                            expectedOutput: testCase.expectedOutput,
                            actualOutput: result.output || '',
                            isHidden: testCase.isHidden,
                        });
                    }
                }
            } finally {
                await this.safeRemoveDirectory(compilation.tempDir);
            }
        }

        const executionTime = Date.now() - startedAt;
        const hasRuntimeError = failedCases.some((item) => item.actualOutput.startsWith('ERROR:'));
        const finalVerdict = failedCount === 0
            ? SubmissionStatus.ACCEPTED
            : hasRuntimeError
                ? SubmissionStatus.ERROR
                : SubmissionStatus.WRONG_ANSWER;

        return {
            passedCount,
            failedCount,
            executionTime,
            finalVerdict,
            failedCases,
        };
    }

    static async runCustomInput({
        code,
        language,
        input,
    }: {
        code: string;
        language: string;
        input: string;
    }): Promise<CustomExecutionResult> {
        const normalizedLanguage = this.normalizeLanguage(language);

        const sanitizedCode = this.sanitizeCode(code, normalizedLanguage);
        const sanitizedInput = this.sanitizeInput(input);

        const startedAt = Date.now();
        let result: { ok: boolean; output?: string; error?: string };

        if (normalizedLanguage === 'javascript') {
            result = await this.executeJavascript({
                code: sanitizedCode,
                input: sanitizedInput,
                timeoutMs: TIME_LIMIT_MS,
            });
        } else {
            const compilation = await this.compileCppProgram(sanitizedCode);
            if (!compilation.ok) {
                return {
                    executionTime: Date.now() - startedAt,
                    output: '',
                    status: SubmissionStatus.ERROR,
                    error: compilation.error,
                };
            }

            try {
                result = await this.executeCppBinary({
                    executablePath: compilation.executablePath,
                    input: sanitizedInput,
                    timeoutMs: TIME_LIMIT_MS,
                });
            } finally {
                await this.safeRemoveDirectory(compilation.tempDir);
            }
        }

        const executionTime = Date.now() - startedAt;

        if (!result.ok) {
            return {
                executionTime,
                output: '',
                status: SubmissionStatus.ERROR,
                error: result.error || 'Execution failed',
            };
        }

        return {
            executionTime,
            output: result.output || '',
            status: SubmissionStatus.ACCEPTED,
            error: null,
        };
    }

    private static normalizeLanguage(language: string): NormalizedLanguage {
        const normalized = String(language || '').toLowerCase().trim();
        const resolved = LANGUAGE_ALIASES[normalized];
        if (!resolved) {
            throw new ApiError(400, SUPPORTED_LANGUAGES_MESSAGE);
        }
        return resolved;
    }

    private static sanitizeCode(code: string, language: NormalizedLanguage): string {
        if (typeof code !== 'string') {
            throw new ApiError(400, 'Code must be a string');
        }

        const trimmed = code.replace(/\u0000/g, '').trim();
        if (!trimmed) {
            throw new ApiError(400, 'Code cannot be empty');
        }
        if (trimmed.length > CODE_SIZE_LIMIT) {
            throw new ApiError(413, 'Code is too large');
        }

        if (language === 'cpp') {
            return trimmed;
        }

        const blockedPatterns = [
            /\brequire\s*\(/i,
            /\bimport\s+/i,
            /\bprocess\b/i,
            /\bchild_process\b/i,
            /\bfs\b/i,
            /\bhttp\b/i,
            /\bhttps\b/i,
            /\bnet\b/i,
            /\bWorker\b/i,
            /\beval\s*\(/i,
            /\bFunction\s*\(/i,
            /constructor\s*\.\s*constructor/i,
        ];

        if (blockedPatterns.some((pattern) => pattern.test(trimmed))) {
            throw new ApiError(400, 'Code contains restricted operations');
        }

        return trimmed;
    }

    private static sanitizeInput(input: string): string {
        const normalized = String(input || '').replace(/\u0000/g, '');
        if (normalized.length > INPUT_SIZE_LIMIT) {
            throw new ApiError(413, 'Test input is too large');
        }
        return normalized;
    }

    private static normalizeOutput(output: string): string {
        return output.replace(/\r/g, '').trim();
    }

    private static async compileCppProgram(
        code: string
    ): Promise<{ ok: true; tempDir: string; executablePath: string } | { ok: false; error: string }> {
        const compiler = await this.resolveCppCompiler();
        if (!compiler) {
            return {
                ok: false,
                error: 'C++ compiler not found. Install g++ or clang++ on the server host.',
            };
        }

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proper-cpp-'));
        const sourcePath = path.join(tempDir, 'main.cpp');
        const executablePath = path.join(tempDir, process.platform === 'win32' ? 'program.exe' : 'program');

        try {
            await fs.writeFile(sourcePath, code, 'utf8');

            const compileResult = await this.executeProcess({
                command: compiler,
                args: ['-std=c++17', '-O2', '-pipe', sourcePath, '-o', executablePath],
                cwd: tempDir,
                timeoutMs: COMPILE_TIME_LIMIT_MS,
            });

            if (!compileResult.ok) {
                const reason = compileResult.timedOut
                    ? `Compilation timed out (${COMPILE_TIME_LIMIT_MS}ms)`
                    : this.formatProcessError(compileResult, 'Compilation failed');

                await this.safeRemoveDirectory(tempDir);
                return { ok: false, error: reason };
            }

            return {
                ok: true,
                tempDir,
                executablePath,
            };
        } catch (error: any) {
            await this.safeRemoveDirectory(tempDir);
            return {
                ok: false,
                error: error?.message || 'C++ compilation failed',
            };
        }
    }

    private static async executeCppBinary({
        executablePath,
        input,
        timeoutMs,
    }: {
        executablePath: string;
        input: string;
        timeoutMs: number;
    }): Promise<{ ok: boolean; output?: string; error?: string }> {
        const runResult = await this.executeProcess({
            command: executablePath,
            args: [],
            input,
            timeoutMs: timeoutMs + 100,
        });

        if (!runResult.ok) {
            if (runResult.timedOut) {
                return { ok: false, error: `Time limit exceeded (${timeoutMs}ms)` };
            }

            return {
                ok: false,
                error: this.formatProcessError(runResult, 'Execution failed'),
            };
        }

        return {
            ok: true,
            output: runResult.stdout,
        };
    }

    private static async resolveCppCompiler(): Promise<string | null> {
        if (this.cachedCppCompiler !== undefined) {
            return this.cachedCppCompiler;
        }

        const candidates = ['g++', 'clang++'];
        for (const candidate of candidates) {
            // eslint-disable-next-line no-await-in-loop
            const available = await this.isCommandAvailable(candidate);
            if (available) {
                this.cachedCppCompiler = candidate;
                return candidate;
            }
        }

        this.cachedCppCompiler = null;
        return null;
    }

    private static async isCommandAvailable(command: string): Promise<boolean> {
        const lookupCommand = process.platform === 'win32' ? 'where' : 'which';
        const result = await this.executeProcess({
            command: lookupCommand,
            args: [command],
            timeoutMs: TOOL_DETECTION_TIMEOUT_MS,
        });
        return result.ok;
    }

    private static async executeProcess({
        command,
        args,
        timeoutMs,
        input,
        cwd,
    }: {
        command: string;
        args: string[];
        timeoutMs: number;
        input?: string;
        cwd?: string;
    }): Promise<ProcessExecutionResult> {
        return new Promise((resolve) => {
            const child = spawn(command, args, {
                cwd,
                stdio: 'pipe',
                windowsHide: true,
            });

            let stdout = '';
            let stderr = '';
            let settled = false;
            let timedOut = false;

            const finish = (result: ProcessExecutionResult) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeoutHandle);
                resolve(result);
            };

            const timeoutHandle = setTimeout(() => {
                timedOut = true;
                child.kill('SIGKILL');
            }, timeoutMs);

            child.stdout?.on('data', (chunk: Buffer | string) => {
                stdout += chunk.toString();
            });

            child.stderr?.on('data', (chunk: Buffer | string) => {
                stderr += chunk.toString();
            });

            child.once('error', (error: Error) => {
                finish({
                    ok: false,
                    stdout,
                    stderr,
                    timedOut,
                    exitCode: null,
                    errorMessage: error.message,
                });
            });

            child.once('close', (exitCode: number | null) => {
                finish({
                    ok: !timedOut && exitCode === 0,
                    stdout,
                    stderr,
                    timedOut,
                    exitCode,
                });
            });

            if (typeof input === 'string' && input.length > 0) {
                child.stdin?.write(input);
            }
            child.stdin?.end();
        });
    }

    private static formatProcessError(result: ProcessExecutionResult, fallback: string): string {
        const raw = result.stderr || result.errorMessage || fallback;
        const cleaned = String(raw).replace(/\r/g, '').trim();
        if (!cleaned) {
            return fallback;
        }
        return cleaned.slice(0, MAX_ERROR_MESSAGE_LENGTH);
    }

    private static async safeRemoveDirectory(targetPath: string) {
        await fs.rm(targetPath, { recursive: true, force: true }).catch(() => undefined);
    }

    private static async executeJavascript({
        code,
        input,
        timeoutMs,
    }: {
        code: string;
        input: string;
        timeoutMs: number;
    }): Promise<{ ok: boolean; output?: string; error?: string }> {
        return new Promise((resolve) => {
            const worker = new Worker(WORKER_SOURCE, {
                eval: true,
                resourceLimits: {
                    maxOldGenerationSizeMb: MEMORY_LIMIT_MB,
                    maxYoungGenerationSizeMb: 16,
                    stackSizeMb: 2,
                },
            });

            let settled = false;
            const timeoutHandle = setTimeout(() => {
                if (settled) return;
                settled = true;
                worker.terminate().catch(() => undefined);
                resolve({ ok: false, error: `Time limit exceeded (${timeoutMs}ms)` });
            }, timeoutMs + 100);

            worker.once('message', (message: unknown) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutHandle);
                worker.terminate().catch(() => undefined);

                const payload = message as { ok: boolean; output?: string; error?: string };
                if (payload.ok) {
                    resolve({ ok: true, output: payload.output || '' });
                } else {
                    resolve({ ok: false, error: payload.error || 'Execution failed' });
                }
            });

            worker.once('error', (error: Error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutHandle);
                worker.terminate().catch(() => undefined);
                resolve({ ok: false, error: error.message || 'Worker execution error' });
            });

            worker.postMessage({ code, input, timeoutMs });
        });
    }
}
