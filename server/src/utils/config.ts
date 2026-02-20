import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env explicitly
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log('📝 Config loading from:', envPath);

const envSchema = z.object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGIN: z.string().default('*'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Environment Variable Error:', JSON.stringify(_env.error.format(), null, 2));
    // Check if we can at least see the keys in process.env
    console.log('Available keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')));
    process.exit(1);
}

export const config = _env.data;
