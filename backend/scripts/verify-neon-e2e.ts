import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyAllNeonServices() {
  console.log('====================================================');
  console.log('🚀 NESTORA: E2E VERIFICATION OF ALL 4 NEON SERVICES');
  console.log('====================================================');

  const BASE_URL = 'http://localhost:4000/api/v1';

  // 1. Verify Health & Neon Status
  console.log('\n[1/4] Verifying Health & Neon Service Status...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health response:', JSON.stringify(healthData, null, 2));

  if (healthData.services?.postgres !== 'UP') {
    throw new Error('Postgres is not UP');
  }
  console.log('✅ Service 1 (Postgres): Verified UP and connected to Neon');

  // 2. Verify Superadmin Auth & Neon DB Access
  console.log('\n[2/4] Testing Admin Login against Neon Lakebase Postgres...');
  const loginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: 'NestoraSuperAdmin2026!',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.accessToken) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.data.accessToken;
  console.log('✅ Service 2 (Auth & RBAC): Verified — JWT token received, User:', loginData.data.user.username);

  // 3. Verify Neon Object Storage (Upload a real image file)
  console.log('\n[3/4] Testing Media Upload to Neon Object Storage (S3)...');
  const tempImagePath = path.join(__dirname, 'temp-sample.png');
  // 1x1 transparent PNG buffer
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(tempImagePath, samplePngBuffer);

  const formData = new FormData();
  formData.append('folder', 'properties');
  formData.append('files', new Blob([samplePngBuffer], { type: 'image/png' }), 'neon-test-villa.png');

  const uploadRes = await fetch(`${BASE_URL}/admin/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);

  console.log('Upload response:', JSON.stringify(uploadData, null, 2));
  if (!uploadData.success || !uploadData.data?.url) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }
  const uploadedUrl = uploadData.data.url;
  console.log(`✅ Service 3 (Neon Object Storage): Verified — File stored at: ${uploadedUrl}`);

  // 4. Verify Neon Realtime endpoint
  console.log('\n[4/4] Verifying Neon Realtime Endpoint & Config...');
  const realtimeUrl = process.env.NEON_REALTIME_URL;
  const statusRes = await fetch(`${BASE_URL}/neon/status`);
  const statusData = await statusRes.json();
  console.log('Neon status response:', JSON.stringify(statusData, null, 2));

  if (statusData.data?.services?.realtime?.status !== 'UP') {
    throw new Error('Neon Realtime status is not UP');
  }
  console.log('✅ Service 4 (Neon Realtime): Verified active and configured at:', realtimeUrl);

  console.log('\n====================================================');
  console.log('🎉 ALL 4 NEON SERVICES FULLY VERIFIED END-TO-END!');
  console.log('====================================================');
}

verifyAllNeonServices().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
