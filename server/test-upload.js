const fs = require('fs');
const path = require('path');

// Create dummy PDF
const pdfPath = path.join(__dirname, 'test.pdf');
const pdfContent = '%PDF-1.4\n%\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/Name /F1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\n0000000216 00000 n\n0000000305 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n400\n%%EOF';
fs.writeFileSync(pdfPath, pdfContent);

async function testUpload() {
    try {
        console.log('1. Login as Teacher...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'teacher.test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
        
        const token = loginData.token;
        console.log('   Logged in:', loginData.user.id);

        console.log('2. Create Course...');
        const courseRes = await fetch('http://localhost:5000/api/courses', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Materials Test Course',
                description: 'Testing PDF uploads'
            })
        });
        const courseData = await courseRes.json();
        if (!courseRes.ok) throw new Error('Create course failed: ' + JSON.stringify(courseData));
        
        const courseId = courseData.course.id;
        console.log('   Course Created:', courseId);

        console.log('3. Upload Material...');
        // Node 18+ FormData
        const blob = await new Promise((resolve, reject) => {
            const stream = fs.createReadStream(pdfPath);
            const chunks = [];
            stream.on('data', c => chunks.push(c));
            stream.on('end', () => resolve(new Blob(chunks, { type: 'application/pdf' })));
            stream.on('error', reject);
        });

        const form = new FormData();
        form.append('file', blob, 'test.pdf');
        form.append('title', 'Lecture Notes PDF');

        const uploadRes = await fetch(`http://localhost:5000/api/courses/${courseId}/materials`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error('Upload failed: ' + JSON.stringify(uploadData));

        console.log('   Material Uploaded:', uploadData.data.id);
        console.log('   File URL:', uploadData.data.fileUrl);

        console.log('4. Get Materials...');
        const getRes = await fetch(`http://localhost:5000/api/courses/${courseId}/materials`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const getData = await getRes.json();
        console.log('   Materials Count:', getData.data.length);

        console.log('5. Delete Material...');
        const materialId = uploadData.data.id;
        const deleteRes = await fetch(`http://localhost:5000/api/materials/${materialId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const deleteData = await deleteRes.json();
        if (!deleteRes.ok) throw new Error('Delete failed: ' + JSON.stringify(deleteData));
        
        console.log('   Material Deleted');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }
}

testUpload();
