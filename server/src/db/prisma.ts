import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// 1. Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

declare global {
    var prisma: PrismaClient | undefined;
}

const url = (process.env.DATABASE_URL || '').trim();

console.log('🔌 [PRISMA] Initializing Database Connection with Standard PG Adapter...');

if (!url) {
    console.error('❌ [PRISMA] CRITICAL: DATABASE_URL is missing!');
}

// 2. Initialize Standard PG Pool
// Since we are running a long-running Node.js server, standard pg is more stable than serverless-specific drivers.
const pool = new Pool({ connectionString: url });

// 3. Create Prisma PG Adapter
const adapter = new PrismaPg(pool);

// 4. Initialize Prisma Client
const prisma = global.prisma || new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error']
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
