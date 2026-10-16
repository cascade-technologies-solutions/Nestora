import fs from 'fs';
import path from 'path';
import { prisma } from '../src/utils/prisma';
import { UPLOAD_BASE_DIR } from '../src/services/storageService';

const API_BASE = 'http://localhost:4000/api/v1';

async function main() {
  console.log('=== Starting Phase P5 Media Storage & Media API Verification ===');

  // 1. Admin login
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
  console.log('✔ Admin authenticated successfully');

  // Create temporary test image files
  const testImgPath = path.join(UPLOAD_BASE_DIR, 'test-sample.png');
  // 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(testImgPath, pngBuffer);

  // 2. Upload valid image via FormData
  const formData = new FormData();
  formData.append('folder', 'properties');
  const fileBlob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('files', fileBlob, 'luxury-penthouse-cover.png');

  const uploadRes = await fetch(`${API_BASE}/admin/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.data?.url) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }
  const asset = uploadData.data;
  console.log(`✔ Upload succeeded: ${asset.name} saved at ${asset.url} (size: ${asset.size} bytes)`);

  // 3. Verify public HTTP access to the uploaded file
  const publicFileRes = await fetch(`http://localhost:4000${asset.url}`);
  if (!publicFileRes.ok) {
    throw new Error(`Failed to access file via public URL: HTTP ${publicFileRes.status}`);
  }
  const contentType = publicFileRes.headers.get('content-type');
  console.log(`✔ Public HTTP GET ${asset.url} returned HTTP 200 (content-type: ${contentType})`);

  // 4. Verify physical disk file exists
  const physicalPath = path.join(UPLOAD_BASE_DIR, asset.url.replace('/uploads/', ''));
  if (!fs.existsSync(physicalPath)) {
    throw new Error(`File does not exist physically on disk at ${physicalPath}`);
  }
  console.log(`✔ Verified physical file exists on host disk at: ${physicalPath}`);

  // 5. List media assets
  const listRes = await fetch(`${API_BASE}/admin/media?folder=properties`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const listData = await listRes.json();
  if (!listRes.ok || !listData.data.some((a: any) => a.id === asset.id)) {
    throw new Error('Uploaded asset not found in media list');
  }
  console.log(`✔ Asset found in media library list (total assets in folder: ${listData.meta.total})`);

  // 6. Rename media asset
  const renameRes = await fetch(`${API_BASE}/admin/media/${asset.id}/rename`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ name: 'luxury-penthouse-renamed.png' }),
  });
  const renameData = await renameRes.json();
  if (!renameRes.ok || renameData.data.name !== 'luxury-penthouse-renamed.png') {
    throw new Error(`Rename failed: ${JSON.stringify(renameData)}`);
  }
  console.log(`✔ Media asset renamed successfully to: ${renameData.data.name}`);

  // 7. Reference check protection:
  // Create a property referencing this image
  const refProp = await prisma.property.create({
    data: {
      propertyCode: 'NST-REF-TEST',
      title: 'Referenced Asset Test Property',
      price: '₹2.00 Cr',
      address: 'Test Address',
      beds: 3,
      baths: 3,
      sqft: 2000,
      type: 'For Sale',
      category: 'Residential',
      isNew: false,
      image: asset.url,
      gallery: [],
      status: 'draft',
      featured: false,
    },
  });

  // Attempt delete without force -> must fail with 409 REFERENCED_ASSET
  const delBlockedRes = await fetch(`${API_BASE}/admin/media/${asset.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const delBlockedData = await delBlockedRes.json();
  if (delBlockedRes.status !== 409 || delBlockedData.error?.code !== 'REFERENCED_ASSET') {
    throw new Error(`Expected 409 REFERENCED_ASSET, got: ${delBlockedRes.status} ${JSON.stringify(delBlockedData)}`);
  }
  console.log(`✔ Reference check passed: deletion blocked (409) because asset is used in Property ${refProp.propertyCode}`);

  // Delete test property
  await prisma.property.delete({ where: { id: refProp.id } });

  // Now delete asset -> must succeed
  const delRes = await fetch(`${API_BASE}/admin/media/${asset.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const delData = await delRes.json();
  if (!delRes.ok || !delData.success) {
    throw new Error(`Delete failed: ${JSON.stringify(delData)}`);
  }
  console.log(`✔ Asset unlinked and deleted from DB and filesystem successfully`);

  // Verify physical file was removed
  if (fs.existsSync(physicalPath)) {
    throw new Error(`Physical file was NOT removed from disk after deletion!`);
  }
  console.log(`✔ Confirmed physical file unlinked from host disk: ${physicalPath}`);

  // 8. Security verification: Unauthenticated upload -> 401
  const unauthUploadRes = await fetch(`${API_BASE}/admin/media/upload`, {
    method: 'POST',
    body: formData,
  });
  if (unauthUploadRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated upload, got ${unauthUploadRes.status}`);
  }
  console.log('✔ Unauthenticated upload correctly blocked with HTTP 401');

  // Clean up temporary local test file
  if (fs.existsSync(testImgPath)) {
    fs.unlinkSync(testImgPath);
  }

  console.log('\n=== ALL PHASE P5 MEDIA & DISK STORAGE VERIFICATIONS PASSED ===\n');
}

main()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
