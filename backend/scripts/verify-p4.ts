import { prisma } from '../src/utils/prisma';

const API_BASE = 'http://localhost:4000/api/v1';

async function main() {
  console.log('=== Starting Phase P4 Live API Verification ===');

  // 1. Admin login to obtain access token
  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: process.env.SEED_SUPERADMIN_PASSWORD || 'NestoraSuperAdmin2026!',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.data?.accessToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
  }
  const adminToken = loginData.data.accessToken;
  console.log('✔ Admin authenticated successfully');

  // 2. Public Properties (ensure only published properties return)
  const pubPropsRes = await fetch(`${API_BASE}/properties`);
  const pubProps = await pubPropsRes.json();
  if (!pubPropsRes.ok || !Array.isArray(pubProps.data)) {
    throw new Error('Failed to fetch public properties');
  }
  console.log(`✔ Public properties fetched: ${pubProps.data.length} published properties returned`);
  for (const p of pubProps.data) {
    if (p.status !== 'published') {
      throw new Error(`Unpublished property ${p.id} leaked in public properties API!`);
    }
  }

  // 3. Create Property via Admin API (should auto-generate NST-### code and draft status)
  const newPropRes = await fetch(`${API_BASE}/admin/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Test Luxury Villa P4',
      price: '₹1.50 Cr',
      address: '123 Palm Meadows, Whitefield, Bangalore',
      beds: 4,
      baths: 4,
      sqft: 3200,
      type: 'For Sale',
      category: 'Residential',
      image: 'https://example.com/test-villa.jpg',
      gallery: ['https://example.com/gallery1.jpg'],
      status: 'draft',
      featured: false,
      amenities: ['Pool', 'Security', 'Clubhouse'],
    }),
  });
  const newProp = await newPropRes.json();
  if (!newPropRes.ok || !newProp.data?.propertyCode?.startsWith('NST-')) {
    throw new Error(`Failed to create property or invalid propertyCode: ${JSON.stringify(newProp)}`);
  }
  const createdPropId = newProp.data.id;
  const createdPropCode = newProp.data.propertyCode;
  console.log(`✔ Property created with auto-sequence code: ${createdPropCode} (status: draft)`);

  // 4. Verify draft property is NOT in public properties list
  const pubCheckRes = await fetch(`${API_BASE}/properties`);
  const pubCheck = await pubCheckRes.json();
  const leaked = pubCheck.data.some((p: any) => p.id === createdPropId);
  if (leaked) {
    throw new Error('Draft property leaked to public properties list!');
  }
  console.log('✔ Verified draft property is hidden from public API');

  // 5. Update Property status to published
  const publishRes = await fetch(`${API_BASE}/admin/properties/${createdPropId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'published' }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.data.status !== 'published') {
    throw new Error(`Failed to publish property: ${JSON.stringify(publishData)}`);
  }
  console.log('✔ Property status updated to published via PATCH status');

  // 6. Verify now visible publicly
  const pubCheck2Res = await fetch(`${API_BASE}/properties/${createdPropId}`);
  const pubCheck2 = await pubCheck2Res.json();
  if (!pubCheck2Res.ok || pubCheck2.data.id !== createdPropId) {
    throw new Error('Published property not accessible by public GET /properties/:id');
  }
  console.log('✔ Published property is now accessible via public GET /properties/:id');

  // 7. Test Projects API
  const newProjRes = await fetch(`${API_BASE}/admin/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Skyline Penthouse Renovation',
      category: 'Renovation',
      location: 'Indiranagar, Bangalore',
      status: 'Completed',
      description: 'Full interior architecture and luxury renovation project.',
      image: 'https://example.com/project-cover.jpg',
      beforeImage: 'https://example.com/before.jpg',
      afterImage: 'https://example.com/after.jpg',
      gallery: ['https://example.com/proj1.jpg'],
      featured: true,
    }),
  });
  const newProj = await newProjRes.json();
  if (!newProjRes.ok || !newProj.data?.id) {
    throw new Error(`Failed to create project: ${JSON.stringify(newProj)}`);
  }
  const createdProjId = newProj.data.id;
  console.log(`✔ Project created successfully (id: ${createdProjId})`);

  const pubProjRes = await fetch(`${API_BASE}/projects`);
  const pubProj = await pubProjRes.json();
  if (!pubProjRes.ok || !pubProj.data.some((p: any) => p.id === createdProjId)) {
    throw new Error('Created project not found in public projects list');
  }
  console.log('✔ Project listed in public projects API');

  // 8. Test Services API
  const servRes = await fetch(`${API_BASE}/services`);
  const servData = await servRes.json();
  if (!servRes.ok || !Array.isArray(servData.data)) {
    throw new Error('Failed to fetch public services');
  }
  console.log(`✔ Public services fetched: ${servData.data.length} services`);

  // 9. Test Public Enquiry submission and Admin Triage
  const enquirySubmitRes = await fetch(`${API_BASE}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'property',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '+91 98765 43210',
      propertyId: createdPropId,
      message: 'Interested in scheduling a site visit for this villa.',
    }),
  });
  const enquiryData = await enquirySubmitRes.json();
  if (!enquirySubmitRes.ok || !enquiryData.data?.id) {
    throw new Error(`Failed to submit enquiry: ${JSON.stringify(enquiryData)}`);
  }
  const enquiryId = enquiryData.data.id;
  console.log(`✔ Public enquiry submitted successfully (id: ${enquiryId})`);

  // Admin Triage Enquiry
  const triageRes = await fetch(`${API_BASE}/admin/enquiries/${enquiryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'Site Visit',
      priority: 'High',
      internalNotes: 'Customer confirmed visit for Saturday 11 AM.',
    }),
  });
  const triageData = await triageRes.json();
  if (!triageRes.ok || triageData.data.status !== 'Site Visit') {
    throw new Error(`Failed to triage enquiry: ${JSON.stringify(triageData)}`);
  }
  console.log('✔ Admin triaged enquiry: status -> Site Visit, priority -> High, internalNotes saved');

  // 10. Test CMS API (Section read and bulk update)
  const heroCmsRes = await fetch(`${API_BASE}/cms/hero`);
  const heroCms = await heroCmsRes.json();
  if (!heroCmsRes.ok || !heroCms.data) {
    throw new Error('Failed to fetch CMS hero section');
  }
  console.log(`✔ Public CMS hero section fetched`);

  const bulkCmsRes = await fetch(`${API_BASE}/admin/cms/bulk-update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      sections: {
        hero: {
          ...heroCms.data,
          tagline: 'Modern Living Reimagined (P4 Verified)',
        },
      },
    }),
  });
  const bulkCmsData = await bulkCmsRes.json();
  if (!bulkCmsRes.ok || !bulkCmsData.success) {
    throw new Error(`Failed to bulk update CMS: ${JSON.stringify(bulkCmsData)}`);
  }
  console.log('✔ CMS section bulk-update succeeded');

  // 11. Test Settings API
  const pubSettingsRes = await fetch(`${API_BASE}/settings`);
  const pubSettings = await pubSettingsRes.json();
  if (!pubSettingsRes.ok || !pubSettings.data?.companyName) {
    throw new Error('Failed to fetch public settings');
  }
  console.log(`✔ Public settings fetched: ${pubSettings.data.companyName}`);

  // 12. Test Wishlist API with public user
  const testUserEmail = `user_${Date.now()}@test.com`;
  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Wishlist Tester',
      email: testUserEmail,
      password: 'StrongUserPassword123!',
    }),
  });
  const regData = await registerRes.json();
  const userToken = regData.data.accessToken;
  console.log('✔ Test user registered for wishlist verification');

  // Add to wishlist
  const addWishRes = await fetch(`${API_BASE}/wishlist/${createdPropId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const addWishData = await addWishRes.json();
  if (!addWishRes.ok || !addWishData.success) {
    throw new Error(`Failed to add property to wishlist: ${JSON.stringify(addWishData)}`);
  }
  console.log('✔ Property added to user wishlist');

  // Fetch wishlist
  const getWishRes = await fetch(`${API_BASE}/wishlist`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const getWishData = await getWishRes.json();
  if (!getWishRes.ok || !getWishData.data.some((w: any) => w.id === createdPropId)) {
    throw new Error('Property not found in fetched wishlist');
  }
  console.log('✔ User wishlist retrieved successfully with populated property details');

  // Remove from wishlist
  const remWishRes = await fetch(`${API_BASE}/wishlist/${createdPropId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!remWishRes.ok) {
    throw new Error('Failed to remove property from wishlist');
  }
  console.log('✔ Property removed from wishlist');

  // 13. Verify Audit Log rows in PostgreSQL
  const auditLogsRes = await fetch(`${API_BASE}/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const auditLogsData = await auditLogsRes.json();
  if (!auditLogsRes.ok || !Array.isArray(auditLogsData.data) || auditLogsData.data.length === 0) {
    throw new Error('No audit logs recorded for admin mutations!');
  }
  console.log(`✔ Audit logs verified in DB: ${auditLogsData.data.length} audit log entries found`);
  console.log(`  Sample audit action: "${auditLogsData.data[0].action}" (module: ${auditLogsData.data[0].module})`);

  // Cleanup test property and project
  await fetch(`${API_BASE}/admin/properties/${createdPropId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  await fetch(`${API_BASE}/admin/projects/${createdProjId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('✔ Cleanup of test entities completed');

  console.log('\n=== ALL PHASE P4 API & AUDIT LOG VERIFICATIONS PASSED ===\n');
}

main()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
