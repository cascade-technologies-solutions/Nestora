import { prisma } from '../src/utils/prisma';

const API_BASE = 'http://localhost:4000/api/v1';

async function main() {
  console.log('--- Starting Phase P8 Data Migration Verification ---');

  // 1. Authenticate as Super Admin
  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: process.env.SUPERADMIN_DEFAULT_PASSWORD || 'NestoraSuperAdmin2026!',
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Super admin login failed: ${loginRes.status}`);
  }
  const loginJson = await loginRes.json();
  const token = loginJson.data.accessToken;
  console.log('✓ Super Admin logged in successfully.');

  // 2. Export database
  const exportRes = await fetch(`${API_BASE}/admin/migrate/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!exportRes.ok) {
    throw new Error(`Export failed: ${exportRes.status}`);
  }
  const exportJson = await exportRes.json();
  console.log('✓ Database exported successfully:');
  console.log('  Export counts:', exportJson.data.counts);

  // 3. Import migration payload
  const migrationPayload = {
    properties: [
      {
        propertyCode: 'NST-MIG-01',
        title: 'Migrated Luxury Villa from Backup',
        price: '₹2.8 Cr',
        address: 'Shirur Park, Hubli',
        beds: 4,
        baths: 4,
        sqft: 3200,
        type: 'For Sale',
        category: 'Residential',
        isNew: true,
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        status: 'published',
        featured: true,
        amenities: ['Swimming Pool', 'Solar Backup', 'Italian Marble'],
      },
    ],
    projects: [
      {
        title: 'Migrated Corporate Tower Project',
        category: 'Construction',
        location: 'Airport Road, Hubli',
        status: 'In Progress',
        description: 'Commercial high-rise infrastructure project.',
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800',
        featured: true,
      },
    ],
    services: [
      {
        title: 'Migrated Structural Engineering',
        description: 'Advanced structural assessment and foundation design.',
        icon: 'Building2',
        color: '#0284c7',
        order: 99,
        enabled: true,
        workTypes: ['Foundations', 'Seismic Analysis'],
      },
    ],
    enquiries: [
      {
        name: 'Migration Test User',
        email: 'migrated.test@nestora.in',
        phone: '+91 99999 88888',
        message: 'I am interested in the migrated luxury villa.',
        type: 'property',
        status: 'New',
        priority: 'High',
      },
    ],
    cms: {
      hero: {
        heroHeading: 'MIGRATED HEADLINE',
        heroDescription: 'Migrated hero text from localStorage backup.',
      },
    },
    settings: {
      companyName: 'Nestora Corporate Group',
      footerTagline: 'Engineering Tomorrow, Restoring Today',
    },
  };

  const importRes = await fetch(`${API_BASE}/admin/migrate/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(migrationPayload),
  });

  if (!importRes.ok) {
    const errText = await importRes.text();
    throw new Error(`Import failed with status ${importRes.status}: ${errText}`);
  }

  const importJson = await importRes.json();
  console.log('✓ Migration import succeeded:');
  console.log('  Import summary:', importJson.data.imported);

  // 4. Verify in PostgreSQL database
  const prop = await prisma.property.findUnique({ where: { propertyCode: 'NST-MIG-01' } });
  if (!prop || prop.title !== 'Migrated Luxury Villa from Backup') {
    throw new Error('Migrated property was not found in PostgreSQL!');
  }
  console.log('✓ Migrated property verified in PostgreSQL: id =', prop.id);

  const proj = await prisma.project.findFirst({ where: { title: 'Migrated Corporate Tower Project' } });
  if (!proj) {
    throw new Error('Migrated project was not found in PostgreSQL!');
  }
  console.log('✓ Migrated project verified in PostgreSQL: id =', proj.id);

  // 5. Verify unauthenticated blocked
  const unauthRes = await fetch(`${API_BASE}/admin/migrate/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(migrationPayload),
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated import, got ${unauthRes.status}`);
  }
  console.log('✓ Unauthenticated migration access rejected with 401.');

  console.log('--- Phase P8 Backend Verification PASSED COMPLETELY ---');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('P8 Verification Failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
