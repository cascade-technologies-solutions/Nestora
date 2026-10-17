import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logAudit } from '../utils/auditLogger';

export const migrationController = {
  // Export entire live database as structured JSON
  async exportDatabase(req: Request, res: Response) {
    const [properties, projects, services, enquiries, cmsSections, settings] = await Promise.all([
      prisma.property.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.service.findMany({ orderBy: { order: 'asc' } }),
      prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.cmsSection.findMany(),
      prisma.settings.findFirst(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        counts: {
          properties: properties.length,
          projects: projects.length,
          services: services.length,
          enquiries: enquiries.length,
          cmsSections: cmsSections.length,
        },
        payload: {
          properties,
          projects,
          services,
          enquiries,
          cmsSections,
          settings,
        },
      },
    });
  },

  // Idempotently import / upsert localStorage or JSON backup into PostgreSQL
  async importData(req: Request, res: Response) {
    const user = (req as any).user;
    const { properties, projects, services, enquiries, cms, settings } = req.body || {};

    const summary = {
      properties: 0,
      projects: 0,
      services: 0,
      enquiries: 0,
      cms: false,
      settings: false,
    };

    // 1. Properties
    if (Array.isArray(properties) && properties.length > 0) {
      for (const p of properties) {
        if (!p.title || !p.price || !p.address) continue;
        const id = p.id ? String(p.id) : undefined;
        const code = p.propertyCode || `NST-${Math.floor(100 + Math.random() * 900)}`;

        const data = {
          title: String(p.title),
          price: String(p.price),
          address: String(p.address),
          beds: Number(p.beds) || 0,
          baths: Number(p.baths) || 0,
          sqft: Number(p.sqft) || 0,
          type: String(p.type || 'For Sale'),
          category: String(p.category || 'Residential'),
          isNew: Boolean(p.isNew),
          image: String(p.image || ''),
          gallery: Array.isArray(p.gallery) ? p.gallery : [],
          status: String(p.status || 'published'),
          featured: Boolean(p.featured),
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          seoTitle: p.seoTitle ? String(p.seoTitle) : null,
          seoDescription: p.seoDescription ? String(p.seoDescription) : null,
          seoKeywords: p.seoKeywords ? String(p.seoKeywords) : null,
        };

        if (id) {
          const existing = await prisma.property.findUnique({ where: { id } });
          if (existing) {
            await prisma.property.update({
              where: { id },
              data,
            });
            summary.properties++;
            continue;
          }
        }

        // Check if propertyCode already exists
        const existingCode = await prisma.property.findUnique({ where: { propertyCode: code } });
        if (existingCode) {
          await prisma.property.update({
            where: { propertyCode: code },
            data,
          });
        } else {
          await prisma.property.create({
            data: {
              ...(id ? { id } : {}),
              propertyCode: code,
              ...data,
            },
          });
        }
        summary.properties++;
      }
    }

    // 2. Projects
    if (Array.isArray(projects) && projects.length > 0) {
      for (const pr of projects) {
        if (!pr.title || !pr.category || !pr.location) continue;
        const id = pr.id ? String(pr.id) : undefined;
        const data = {
          title: String(pr.title),
          category: String(pr.category),
          location: String(pr.location),
          status: String(pr.status || 'In Progress'),
          description: String(pr.description || ''),
          image: String(pr.image || ''),
          beforeImage: pr.beforeImage ? String(pr.beforeImage) : null,
          afterImage: pr.afterImage ? String(pr.afterImage) : null,
          gallery: Array.isArray(pr.gallery) ? pr.gallery : [],
          featured: Boolean(pr.featured),
        };

        if (id) {
          const existing = await prisma.project.findUnique({ where: { id } });
          if (existing) {
            await prisma.project.update({ where: { id }, data });
            summary.projects++;
            continue;
          }
        }

        await prisma.project.create({
          data: {
            ...(id ? { id } : {}),
            ...data,
          },
        });
        summary.projects++;
      }
    }

    // 3. Services
    if (Array.isArray(services) && services.length > 0) {
      for (const s of services) {
        if (!s.title) continue;
        const id = s.id ? String(s.id) : undefined;
        const data = {
          title: String(s.title),
          description: String(s.description || ''),
          icon: String(s.icon || 'Wrench'),
          color: String(s.color || '#2563eb'),
          image: s.image ? String(s.image) : null,
          workTypes: Array.isArray(s.workTypes) ? s.workTypes : Array.isArray(s.features) ? s.features : [],
          order: Number(s.order !== undefined ? s.order : s.orderIndex) || 0,
          enabled: s.enabled !== undefined ? Boolean(s.enabled) : true,
        };

        if (id) {
          const existing = await prisma.service.findUnique({ where: { id } });
          if (existing) {
            await prisma.service.update({
              where: { id },
              data,
            });
            summary.services++;
            continue;
          }
        }

        const existingTitle = await prisma.service.findFirst({ where: { title: data.title } });
        if (existingTitle) {
          await prisma.service.update({
            where: { id: existingTitle.id },
            data,
          });
        } else {
          await prisma.service.create({
            data: {
              ...(id ? { id } : {}),
              ...data,
            },
          });
        }
        summary.services++;
      }
    }

    // 4. Enquiries
    if (Array.isArray(enquiries) && enquiries.length > 0) {
      for (const e of enquiries) {
        if (!e.name || !e.email || !e.message) continue;
        const id = e.id ? String(e.id) : undefined;
        const data = {
          name: String(e.name),
          email: String(e.email),
          phone: String(e.phone || ''),
          message: String(e.message),
          propertyId: e.propertyId ? String(e.propertyId) : null,
          serviceId: e.serviceId ? String(e.serviceId) : null,
          type: String(e.type || 'contact'),
          status: String(e.status || 'New'),
          priority: String(e.priority || 'Medium'),
          internalNotes: e.internalNotes ? String(e.internalNotes) : e.notes ? String(e.notes) : null,
        };

        if (id) {
          const existing = await prisma.enquiry.findUnique({ where: { id } });
          if (existing) {
            await prisma.enquiry.update({ where: { id }, data });
            summary.enquiries++;
            continue;
          }
        }

        await prisma.enquiry.create({
          data: {
            ...(id ? { id } : {}),
            ...data,
          },
        });
        summary.enquiries++;
      }
    }

    // 5. CMS Sections
    if (cms && typeof cms === 'object') {
      const entries = Object.entries(cms);
      for (const [key, content] of entries) {
        if (content && typeof content === 'object') {
          await prisma.cmsSection.upsert({
            where: { section: key },
            create: { section: key, content: content as any },
            update: { content: content as any },
          });
        }
      }
      summary.cms = true;
    }

    // 6. Settings
    if (settings && typeof settings === 'object') {
      const existing = await prisma.settings.findFirst();
      const settingsData = {
        companyName: String(settings.companyName || 'Nestora Infrastructure & Real Estate'),
        logoUrl: String(settings.logoUrl || ''),
        phone: String(settings.phone || '+91 98765 43210'),
        email: String(settings.email || 'contact@nestora.in'),
        address: String(settings.address || 'Hubli, Karnataka, India'),
        whatsapp: String(settings.whatsapp || '+91 98765 43210'),
        whatsappCommunityUrl: String(settings.whatsappCommunityUrl || ''),
        facebook: settings.facebook ? String(settings.facebook) : settings.socialLinks?.facebook || null,
        instagram: settings.instagram ? String(settings.instagram) : settings.socialLinks?.instagram || null,
        linkedin: settings.linkedin ? String(settings.linkedin) : settings.socialLinks?.linkedin || null,
        twitter: settings.twitter ? String(settings.twitter) : settings.socialLinks?.twitter || null,
        footerTagline: String(settings.footerTagline || 'Building the future of infrastructure'),
      };

      if (existing) {
        await prisma.settings.update({
          where: { id: existing.id },
          data: settingsData,
        });
      } else {
        await prisma.settings.create({
          data: settingsData,
        });
      }
      summary.settings = true;
    }

    // Record audit log
    await logAudit(
      user?.id || 'system',
      `Data Migration: imported ${summary.properties} properties, ${summary.projects} projects, ${summary.services} services`,
      'Settings'
    );

    return res.status(200).json({
      success: true,
      data: {
        message: 'Data migration imported successfully into PostgreSQL',
        imported: summary,
      },
    });
  },
};
