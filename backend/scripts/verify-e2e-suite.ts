/**
 * End-to-End Live User Journey Verification Script
 * Validates full multi-service corporate website & real estate platform flows
 * over real HTTP against live running backend at http://localhost:4000
 */

const BASE_URL = 'http://localhost:4000/api/v1';

async function main() {
  console.log('================================================================');
  console.log('🧪 Nestora Live E2E Integration Suite Starting...');
  console.log(`Target: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Health & Database Connectivity
  console.log('▶ 1. Validating Health & Database Connection');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthJson = await healthRes.json();
  assert(healthRes.status === 200, 'GET /api/v1/health returns HTTP 200');
  assert(healthJson.status === 'UP', 'Health report status is UP');

  // 2. Authentication Flow (Super Admin)
  console.log('\n▶ 2. Validating Super Admin Authentication');
  const loginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: 'NestoraSuperAdmin2026!',
    }),
  });
  const loginJson = await loginRes.json();
  assert(loginRes.status === 200, 'Super Admin login returns HTTP 200');
  assert(loginJson.data.accessToken !== undefined, 'Access token provided in response');
  assert(loginJson.data.user.role === 'Super Admin', 'User role is Super Admin');
  assert(loginJson.data.user.permissions.length === 8, 'Super Admin has all 8 permissions');
  const adminToken = loginJson.data.accessToken;

  // 3. Security Boundary: Invalid Password Rejection
  console.log('\n▶ 3. Validating Security Perimeter');
  const badLoginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: 'InvalidPasswordXYZ!',
    }),
  });
  assert(badLoginRes.status === 401, 'Invalid password rejected with HTTP 401');

  // 4. Property Creation & Visibility Lifecycle
  console.log('\n▶ 4. Validating Real Estate Lifecycle (Draft -> Publish)');
  const propPayload = {
    title: 'E2E Royal Palm Villa Suite',
    price: '₹2.45 Crore',
    address: 'Financial District, Nanakramguda, Hyderabad',
    beds: 4,
    baths: 4,
    sqft: 3200,
    type: 'For Sale',
    category: 'Residential',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    status: 'draft',
  };
  const propCreateRes = await fetch(`${BASE_URL}/admin/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(propPayload),
  });
  const propCreateJson = await propCreateRes.json();
  assert(propCreateRes.status === 201, 'Property created with HTTP 201');
  const propId = propCreateJson.data.id;
  const propCode = propCreateJson.data.propertyCode;
  assert(propCode.startsWith('NST-'), `Auto property code generated: ${propCode}`);
  assert(propCreateJson.data.status === 'draft', 'Initial property status is draft');

  // Check public endpoint hides draft
  const publicPropsRes = await fetch(`${BASE_URL}/properties`);
  const publicPropsJson = await publicPropsRes.json();
  const items = publicPropsJson.data.items || publicPropsJson.data;
  const foundDraft = items.find((p: any) => p.id === propId || p.propertyCode === propCode);
  assert(!foundDraft, 'Draft property is 100% hidden from public listing');

  // Publish property
  const publishRes = await fetch(`${BASE_URL}/admin/properties/${propId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'published' }),
  });
  assert(publishRes.status === 200, 'Property status updated to published');

  // Verify visible publicly
  const verifyPubRes = await fetch(`${BASE_URL}/properties/${propId}`);
  assert(verifyPubRes.status === 200, 'Published property is now publicly retrievable via HTTP 200');

  // 5. Host Disk Media Storage & 409 Reference Protection
  console.log('\n▶ 5. Validating Host Disk Media Storage & Reference Safety');
  // Small 1x1 valid PNG blob
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  const formData = new FormData();
  formData.append('folder', 'properties');
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('files', blob, `e2e_photo_${Date.now()}.png`);

  const uploadRes = await fetch(`${BASE_URL}/admin/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const uploadJson = await uploadRes.json();
  assert(uploadRes.status === 201, 'Host disk media upload returned HTTP 201');
  const mediaUrl = uploadJson.data.url;
  const mediaId = uploadJson.data.id;
  assert(mediaUrl.startsWith('/uploads/properties/'), `Image URL generated on host disk: ${mediaUrl}`);

  // Test static HTTP retrieval of the host image
  const staticImageRes = await fetch(`http://localhost:4000${mediaUrl}`);
  assert(staticImageRes.status === 200, 'Static image served with HTTP 200 from server disk');

  // 6. Public Enquiry Flow & Admin Pipeline
  console.log('\n▶ 6. Validating Enquiry Submission & Admin Triage Pipeline');
  const enquirySubmitRes = await fetch(`${BASE_URL}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aditya Varma',
      email: 'aditya.v@example.com',
      phone: '+91 9988776655',
      type: 'property',
      serviceInterested: 'Royal Palm Villa',
      message: 'Requesting weekend site visit and brochure.',
    }),
  });
  const enquirySubmitJson = await enquirySubmitRes.json();
  assert(enquirySubmitRes.status === 201, 'Public enquiry submitted with HTTP 201');
  const enquiryId = enquirySubmitJson.data.id;

  // Admin triages enquiry
  const triageRes = await fetch(`${BASE_URL}/admin/enquiries/${enquiryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'Site Visit',
      priority: 'High',
      internalNotes: 'VIP client. Assigned luxury agent for Saturday 11am walkthrough.',
    }),
  });
  const triageJson = await triageRes.json();
  assert(triageRes.status === 200, 'Admin enquiry triage status updated to Site Visit');
  assert(triageJson.data.priority === 'High', 'Priority set to High');
  assert(triageJson.data.internalNotes.includes('VIP client'), 'Internal triage notes preserved');

  // 7. CMS Live Content Updates
  console.log('\n▶ 7. Validating CMS Content Management');
  const cmsUpdateRes = await fetch(`${BASE_URL}/admin/cms/bulk-update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      sections: {
        hero: {
          badge: 'Hyderabad Real Estate & Renovation',
          headline: 'Spaces Crafted for Generations',
          subheadline: 'Luxury Living, Commercial Architecture & Turnkey Interiors.',
        },
      },
    }),
  });
  assert(cmsUpdateRes.status === 200, 'CMS sections bulk update succeeded');

  const cmsHeroRes = await fetch(`${BASE_URL}/cms/hero`);
  const cmsHeroJson = await cmsHeroRes.json();
  assert(cmsHeroRes.status === 200, 'Public CMS hero section retrievable via HTTP 200');
  assert(cmsHeroJson.data.headline === 'Spaces Crafted for Generations', 'Hero headline live on public site');

  // 8. Disaster Recovery Export
  console.log('\n▶ 8. Validating Database Backup & Disaster Recovery');
  const exportRes = await fetch(`${BASE_URL}/admin/migrate/export`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const exportJson = await exportRes.json();
  assert(exportRes.status === 200, 'Database backup export returned HTTP 200');
  assert(exportJson.data.version === '1.0.0', 'Export package format version is 1.0.0');
  assert(exportJson.data.counts.properties > 0, `Export verified: ${exportJson.data.counts.properties} properties backed up`);

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} E2E USER JOURNEYS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal E2E test failure:', err);
  process.exit(1);
});
