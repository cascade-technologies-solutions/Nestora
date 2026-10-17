const API_BASE = 'http://localhost:4000/api/v1';

async function main() {
  console.log('=== Starting Phase P6 Security Hardening & Error Handling Verification ===');

  // 1. Verify Helmet Security Headers
  const healthRes = await fetch(`${API_BASE}/health`);
  const headers = Object.fromEntries(healthRes.headers.entries());
  console.log('✔ Helmet Security Headers inspected:');
  console.log(`  - x-content-type-options: ${headers['x-content-type-options']}`);
  console.log(`  - cross-origin-resource-policy: ${headers['cross-origin-resource-policy']}`);
  console.log(`  - x-dns-prefetch-control: ${headers['x-dns-prefetch-control']}`);

  if (!headers['x-content-type-options']) {
    throw new Error('Helmet security headers missing!');
  }
  console.log('✔ Helmet security headers verified');

  // 2. Admin login
  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: process.env.SEED_SUPERADMIN_PASSWORD || 'NestoraSuperAdmin2026!',
    }),
  });
  const loginData = await loginRes.json();
  const adminToken = loginData.data?.accessToken;
  if (!adminToken) {
    throw new Error('Admin login failed');
  }

  // 3. Centralized Validation Error Handling (Zod 400 + field details)
  const malformedRes = await fetch(`${API_BASE}/admin/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      // Missing title, price, address, etc.
      type: 'InvalidType',
    }),
  });
  const malformedData = await malformedRes.json();
  if (malformedRes.status !== 400 || malformedData.error?.code !== 'VALIDATION_ERROR') {
    throw new Error(`Expected 400 VALIDATION_ERROR, got ${malformedRes.status}: ${JSON.stringify(malformedData)}`);
  }
  if (!malformedData.error?.details?.title) {
    throw new Error(`Field errors missing from validation error response: ${JSON.stringify(malformedData)}`);
  }
  console.log('✔ Centralized Zod validation handler verified: 400 VALIDATION_ERROR with structured field errors');

  // 4. Duplicate Resource Conflict (Prisma P2002 -> 409 DUPLICATE)
  const existingEmail = `dup_test_${Date.now()}@example.com`;
  // Register user once
  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Tester',
      email: existingEmail,
      password: 'Password123!',
    }),
  });
  // Attempt second registration with same email
  const dupRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Tester 2',
      email: existingEmail,
      password: 'Password123!',
    }),
  });
  const dupData = await dupRes.json();
  if (dupRes.status !== 409 || !['DUPLICATE_RESOURCE', 'DUPLICATE_EMAIL', 'EMAIL_ALREADY_EXISTS'].includes(dupData.error?.code)) {
    throw new Error(`Expected 409 duplicate error, got ${dupRes.status}: ${JSON.stringify(dupData)}`);
  }
  console.log(`✔ Unique constraint collision correctly handled: HTTP 409 (${dupData.error?.code})`);

  // 5. Verify sanitized response: No stack traces or SQL leakage in error responses
  const serialized = JSON.stringify(malformedData) + JSON.stringify(dupData);
  if (serialized.includes('at ') || serialized.includes('node_modules') || serialized.includes('SELECT ')) {
    throw new Error('Stack trace or internal SQL leaked in error response!');
  }
  console.log('✔ Verified zero stack traces or internal SQL leaked to API client');

  console.log('\n=== ALL PHASE P6 SECURITY & HARDENING VERIFICATIONS PASSED ===\n');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
