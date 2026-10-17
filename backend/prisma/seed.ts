import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting idempotent database seed...');

  // 1. Seed Super Admin Employee
  const superadminUsername = (process.env.SEED_SUPERADMIN_USERNAME || 'superadmin').trim().toLowerCase();
  const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'NestoraSuperAdmin2026!';
  const passwordHash = await bcrypt.hash(superadminPassword, 12);

  const superAdmin = await prisma.employee.upsert({
    where: { username: superadminUsername },
    update: {
      passwordHash,
      status: 'Active',
      role: 'Super Admin',
    },
    create: {
      id: 'emp_superadmin',
      name: 'Super Admin',
      username: superadminUsername,
      role: 'Super Admin',
      status: 'Active',
      passwordHash,
      createdAt: new Date(),
    },
  });
  console.log(`✅ Super Admin employee ready: ${superAdmin.username} (${superAdmin.id})`);

  // Grant all permissions explicitly in EmployeePermission table for Super Admin
  const allPermissions = [
    'manage:employees',
    'manage:settings',
    'manage:properties',
    'manage:projects',
    'manage:services',
    'manage:enquiries',
    'manage:media',
    'manage:cms',
  ];

  for (const perm of allPermissions) {
    await prisma.employeePermission.upsert({
      where: {
        employeeId_permission: {
          employeeId: superAdmin.id,
          permission: perm,
        },
      },
      update: { granted: true },
      create: {
        employeeId: superAdmin.id,
        permission: perm,
        granted: true,
      },
    });
  }
  console.log(`✅ Granular permissions assigned to Super Admin`);

  // 2. Seed Default Settings
  const defaultSettings = {
    companyName: 'NestoraHub',
    logoUrl: '',
    phone: '+91 99026 76457',
    email: 'info@nestora.com',
    address: 'Nestora Ave, Sri Sai Properties, Vidya Nagar, Hubli 580001',
    whatsapp: '+919902676457',
    whatsappCommunityUrl: 'https://chat.whatsapp.com/test',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
    footerTagline: 'From renovation and waterproofing to construction, fabrication, earthmoving, and real estate – complete engineering and project solutions under one roof.',
  };

  const existingSettings = await prisma.settings.findFirst();
  if (existingSettings) {
    await prisma.settings.update({
      where: { id: existingSettings.id },
      data: defaultSettings,
    });
  } else {
    await prisma.settings.create({
      data: defaultSettings,
    });
  }
  console.log(`✅ Site Settings configured`);

  // 3. Seed CMS Sections
  const cmsSections = [
    {
      section: 'hero',
      content: {
        heroHeading: 'BUILD.\nRESTORE.\nDEVELOP.',
        heroDescription: 'From renovation and waterproofing to construction, fabrication, earthmoving and real estate — complete technical execution and property solutions under one roof.',
        heroImages: [
          'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        ],
        ctaButtons: [
          { label: 'Explore Our Services', href: '/services', variant: 'primary' },
          { label: 'Discuss Your Project', href: '/contact', variant: 'secondary' }
        ]
      }
    },
    {
      section: 'about',
      content: {
        aboutHeading: 'Complete Solutions. One Trusted Team.',
        aboutText1: 'Nestora handles multi-service technical works across renovation, repair, construction, waterproofing, metal fabrication, earthmoving, and property support services. We offer complete project execution and property assistance under one roof, backed by an execution-focused engineering team.',
        aboutText2: 'We eliminate coordination challenges by unifying construction management, quality-oriented material selections, and municipal process assistance, ensuring your project is completed with transparency.',
        aboutImage: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      }
    },
    {
      section: 'contact',
      content: {
        phone: '+91 99026 76457',
        email: 'info@nestora.com',
        address: 'Nestora Ave, Sri Sai Properties, Vidya Nagar, Hubli 580001'
      }
    },
    {
      section: 'brand_assets',
      content: {
        companyName: 'NestoraHub',
        logoUrl: ''
      }
    },
    {
      section: 'footer',
      content: {
        footerTagline: 'From renovation and waterproofing to construction, fabrication, earthmoving, and real estate – complete engineering and project solutions under one roof.',
        whatsapp: '+919902676457',
        whatsappCommunityUrl: 'https://chat.whatsapp.com/test'
      }
    },
    {
      section: 'social',
      content: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    }
  ];

  for (const s of cmsSections) {
    await prisma.cmsSection.upsert({
      where: { section: s.section },
      update: { content: s.content },
      create: { section: s.section, content: s.content },
    });
  }
  console.log(`✅ CMS sections seeded (hero, about, contact, brand_assets, footer, social)`);

  // 4. Seed Services (9 Reference Services)
  const initialServices = [
    {
      id: 'real-estate',
      title: 'Real Estate',
      description: 'Comprehensive property search, verified titles, buying, selling, and rental advisory across Hubli-Dharwad.',
      icon: 'Home',
      color: 'bg-blue-500',
      enabled: true,
      order: 1,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Buy residential plots', 'Sell properties', 'Commercial leasing', 'Rental management', 'Title verification']
    },
    {
      id: 'construction',
      title: 'Construction',
      description: 'Turnkey residential and commercial construction with structural engineering, site supervision, and milestone delivery.',
      icon: 'Building',
      color: 'bg-amber-500',
      enabled: true,
      order: 2,
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Residential construction', 'Commercial construction', 'Civil works', 'Structural engineering', 'Turnkey execution']
    },
    {
      id: 'fabrication',
      title: 'Fabrication',
      description: 'Custom structural steel, architectural metalwork, industrial frames, safety barriers, and precision metal fabrication.',
      icon: 'Hammer',
      color: 'bg-emerald-500',
      enabled: true,
      order: 3,
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Steel structures', 'Metal fabrication', 'Custom gates & grills', 'Industrial frames', 'Architectural metal']
    },
    {
      id: 'renovation',
      title: 'Renovation',
      description: 'Complete home and commercial remodelling, layout restructuring, interior upgrades, and building restorations.',
      icon: 'Hammer',
      color: 'bg-rose-500',
      enabled: true,
      order: 4,
      image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Home remodelling', 'Office interior upgrades', 'Structural retrofitting', 'Space optimization', 'Facade restoration']
    },
    {
      id: 'repair-works',
      title: 'Repair Works',
      description: 'Electrical, plumbing, carpentry, waterproofing repairs, and general property maintenance for homes and offices.',
      icon: 'Wrench',
      color: 'bg-purple-500',
      enabled: true,
      order: 5,
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Electrical repairs', 'Plumbing fixes', 'Carpentry & masonry', 'Seepage rectification', 'Routine maintenance']
    },
    {
      id: 'packers-and-movers',
      title: 'Packers And Movers',
      description: 'Professional household shifting, office relocation, secure packing, transit insurance, and hassle-free moving support.',
      icon: 'Truck',
      color: 'bg-cyan-500',
      enabled: true,
      order: 6,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Household shifting', 'Corporate relocation', 'Secure multi-layer packing', 'Vehicle transportation', 'Transit insurance']
    },
    {
      id: 'security-services',
      title: 'Security Services',
      description: 'CCTV installation, smart access control, digital surveillance setups, and round-the-clock premises protection.',
      icon: 'ShieldCheck',
      color: 'bg-orange-500',
      enabled: true,
      order: 7,
      image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800',
      workTypes: ['CCTV surveillance cameras', 'Smart door locks & biometric', 'Intercom & alarm systems', 'On-site security staffing', 'Annual maintenance']
    },
    {
      id: 'documentation-and-approvals',
      title: 'Documentation And Approvals',
      description: 'Khata registration, building plan sanctions, municipal approvals, title verification, and government certifications.',
      icon: 'FileText',
      color: 'bg-blue-600',
      enabled: true,
      order: 8,
      image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Khata transfer & extract', 'Building plan sanction', 'Encumbrance certificates (EC)', 'Title deed verification', 'RERA advisory']
    },
    {
      id: 'property-ads',
      title: 'Property Ads',
      description: 'Targeted property marketing, high-visibility digital advertising, buyer matching, and listing promotion across Hubli-Dharwad.',
      icon: 'FileText',
      color: 'bg-pink-500',
      enabled: true,
      order: 9,
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
      workTypes: ['Digital property promotion', 'Premium yard & banner ads', 'Targeted buyer outreach', 'Social media ad campaigns', 'Lead verification']
    }
  ];

  for (const s of initialServices) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log(`✅ Services seeded (${initialServices.length} services)`);

  // 5. Seed Properties from static data
  const sampleProperties = [
    {
      propertyCode: 'NST-101',
      title: 'Modern Minimalist Villa',
      price: '₹1.25 Cr',
      address: 'Vidyanagar, Hubli',
      beds: 4,
      baths: 3,
      sqft: 2800,
      type: 'For Sale',
      category: 'Residential',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      ],
      status: 'published',
      featured: true,
      assignedAdmin: 'Super Admin',
      amenities: ['Water Supply', 'Car Parking', 'Electricity Backup', 'Security Guard'],
      seoTitle: 'Modern Minimalist Villa for sale in Vidyanagar, Hubli',
      seoDescription: '4 BHK luxury villa with contemporary architecture in prime Hubli location.',
      seoKeywords: 'villa, hubli, real estate, vidyanagar'
    },
    {
      propertyCode: 'NST-102',
      title: 'Luxury Beachfront Condo',
      price: '₹55,000/mo',
      address: 'Keshwapur, Hubli',
      beds: 3,
      baths: 2,
      sqft: 1950,
      type: 'For Rent',
      category: 'Residential',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      ],
      status: 'published',
      featured: true,
      assignedAdmin: 'Super Admin',
      amenities: ['Car Parking', 'Gym', 'Swimming Pool', 'Security'],
      seoTitle: 'Luxury Condo for rent in Keshwapur, Hubli',
      seoDescription: 'Spacious 3 BHK condo for rent with modern amenities.',
      seoKeywords: 'condo, rent, hubli, keshwapur'
    },
    {
      propertyCode: 'NST-103',
      title: 'Contemporary City Apartment',
      price: '₹85 L',
      address: 'Navanagar, Hubli',
      beds: 2,
      baths: 2,
      sqft: 1200,
      type: 'For Sale',
      category: 'Residential',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      ],
      status: 'published',
      featured: true,
      assignedAdmin: 'Super Admin',
      amenities: ['Power Backup', 'Lift', 'Covered Parking'],
      seoTitle: 'Contemporary 2BHK Apartment in Navanagar',
      seoDescription: 'Affordable modern 2 BHK apartment in prime growth corridor.',
      seoKeywords: 'apartment, navanagar, for sale'
    },
    {
      propertyCode: 'NST-104',
      title: 'Panoramic Mountain Retreat',
      price: '₹3.2 Cr',
      address: 'Unkal, Hubli',
      beds: 5,
      baths: 4,
      sqft: 3600,
      type: 'For Sale',
      category: 'Residential',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1602343168117-bb8a12d7c180?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1602343168117-bb8a12d7c180?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80'
      ],
      status: 'published',
      featured: false,
      assignedAdmin: 'Super Admin',
      amenities: ['Garden', 'Private Terrace', 'Covered Garage', 'Security'],
      seoTitle: 'Luxury 5 BHK Villa in Unkal',
      seoDescription: 'Sprawling luxury estate overlooking pristine nature in Unkal.',
      seoKeywords: 'luxury villa, unkal, estate'
    }
  ];

  for (const p of sampleProperties) {
    await prisma.property.upsert({
      where: { propertyCode: p.propertyCode },
      update: p,
      create: p,
    });
  }
  console.log(`✅ Properties seeded (${sampleProperties.length} properties)`);

  // 6. Seed Projects from static data
  const sampleProjects = [
    {
      title: 'Commercial Plaza Structure',
      category: 'Construction',
      location: 'Vidyanagar, Hubli',
      status: 'Completed',
      description: 'End-to-end structural works and civil construction of a multi-storey retail and office complex.',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      featured: true
    },
    {
      title: 'Vikas Nagar Residential Makeover',
      category: 'Renovation',
      location: 'Keshwapur, Hubli',
      status: 'Completed',
      description: 'Complete interior remodelling, structural reinforcement, and modernization of a two-storey private residence.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      featured: true
    },
    {
      title: 'Industrial Roof Waterproofing',
      category: 'Waterproofing',
      location: 'Gokul Road, Hubli',
      status: 'Completed',
      description: 'Multi-layered membrane application and crack injection sealing for a large manufacturing warehouse terrace.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      featured: true
    },
    {
      title: 'Custom Structural Steel Framing',
      category: 'Fabrication',
      location: 'Navanagar, Hubli',
      status: 'Completed',
      description: 'Precision heavy-metal fabrication and installation of support trusses and staircases for a commercial site.',
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      featured: false
    }
  ];

  for (const proj of sampleProjects) {
    const existing = await prisma.project.findFirst({ where: { title: proj.title } });
    if (existing) {
      await prisma.project.update({
        where: { id: existing.id },
        data: proj
      });
    } else {
      await prisma.project.create({
        data: proj
      });
    }
  }
  console.log(`✅ Projects seeded (${sampleProjects.length} projects)`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
