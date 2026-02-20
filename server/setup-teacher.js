const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const DB_URL = "postgresql://neondb_owner:npg_Hmn8xyc9AWZg@ep-wandering-sky-ai7otj2i-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function setupTeacher() {
    const pool = new Pool({ connectionString: DB_URL });
    const email = 'teacher.test@example.com';
    const password = 'password123';
    
    try {
        const check = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('✅ Test teacher already exists.');
            return;
        }

        console.log('👤 Creating standard test teacher...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = randomUUID();
        const now = new Date();
        
        await pool.query(
            'INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, email, hashedPassword, 'Test Teacher', 'TEACHER', now, now]
        );
        
        console.log('✅ Test teacher created successfully.');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
    } catch (e) {
        console.error('❌ Failed to create test teacher:', e.message);
    } finally {
        await pool.end();
    }
}

setupTeacher();
