import { storageGet, storageSet, storageHas } from '../lib/storage';
import type { AdminProperty, PropertyStatus } from '../types/admin';
import { allProperties } from '@/data/properties';
import { logActivity } from './activityRepository';
import { requireRole } from '@/admin/lib/rbac';

const PROPERTIES_KEY = 'properties';

function seedIfNeeded(): void {
  if (storageHas(PROPERTIES_KEY)) return;

  const seeded: AdminProperty[] = allProperties.map((p, idx) => ({
    id: String(p.id),
    propertyCode: `NST-${100 + idx + 1}`,
    title: p.title,
    price: p.price,
    address: p.address,
    beds: p.beds,
    baths: p.baths,
    sqft: p.sqft,
    type: p.type as AdminProperty['type'],
    category: p.category as AdminProperty['category'],
    isNew: p.isNew,
    image: p.image,
    status: 'published' as PropertyStatus,
    featured: p.id <= 3,
    assignedAdmin: 'Super Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    amenities: ['Water Supply', 'Car Parking', 'Electricity Backup', 'Security Guard'],
    seoTitle: `${p.title} for sale in ${p.address}`,
    seoDescription: `Get details on this luxury property located at ${p.address}. Beautiful styling and premium architecture.`,
    seoKeywords: 'real estate, Hubli, property development'
  }));

  storageSet<AdminProperty[]>(PROPERTIES_KEY, seeded);
}

export const propertyRepository = {
  async getAll(): Promise<AdminProperty[]> {
    seedIfNeeded();
    const data = storageGet<AdminProperty[]>(PROPERTIES_KEY) ?? [];
    return Promise.resolve(data);
  },

  async getPublished(): Promise<AdminProperty[]> {
    const data = await this.getAll();
    return Promise.resolve(data.filter((p) => p.status === 'published'));
  },

  async getFeatured(): Promise<AdminProperty[]> {
    const data = await this.getAll();
    return Promise.resolve(data.filter((p) => p.featured && p.status === 'published'));
  },

  async getById(id: string): Promise<AdminProperty | null> {
    const data = await this.getAll();
    return Promise.resolve(data.find((p) => p.id === id) ?? null);
  },

  async getByCode(code: string): Promise<AdminProperty | null> {
    const data = await this.getAll();
    return Promise.resolve(data.find((p) => p.propertyCode.toLowerCase() === code.toLowerCase()) ?? null);
  },

  async create(
    data: Omit<AdminProperty, 'id' | 'propertyCode' | 'createdAt' | 'updatedAt'>,
    activeUser: string
  ): Promise<AdminProperty> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const all = await this.getAll();
    const now = new Date().toISOString();
    
    // Generate next property code
    const nextCodeNumber = all.length > 0 
      ? Math.max(...all.map(p => {
          const num = parseInt(p.propertyCode.replace('NST-', ''));
          return isNaN(num) ? 100 : num;
        })) + 1
      : 101;

    const newProp: AdminProperty = {
      ...data,
      id: `prop_${Date.now()}`,
      propertyCode: `NST-${nextCodeNumber}`,
      createdAt: now,
      updatedAt: now,
    };

    storageSet<AdminProperty[]>(PROPERTIES_KEY, [...all, newProp]);
    await logActivity({
      user: activeUser,
      action: `created Property ${newProp.propertyCode} ("${newProp.title}")`,
      module: 'Properties',
    });
    return Promise.resolve(newProp);
  },

  async update(id: string, data: Partial<AdminProperty>, activeUser: string): Promise<AdminProperty> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const all = await this.getAll();
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Property ${id} not found`);
    
    const updated: AdminProperty = {
      ...all[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    storageSet<AdminProperty[]>(PROPERTIES_KEY, all);
    
    await logActivity({
      user: activeUser,
      action: `updated Property ${updated.propertyCode} ("${updated.title}")`,
      module: 'Properties',
    });
    return Promise.resolve(updated);
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const all = await this.getAll();
    const prop = all.find((p) => p.id === id);
    if (!prop) return;

    // Use soft delete by removing from active list, or setting to archived
    const filtered = all.filter((p) => p.id !== id);
    storageSet<AdminProperty[]>(PROPERTIES_KEY, filtered);
    
    await logActivity({
      user: activeUser,
      action: `permanently removed Property ${prop.propertyCode} ("${prop.title}")`,
      module: 'Properties',
    });
    return Promise.resolve();
  },

  async setStatus(id: string, status: PropertyStatus, activeUser: string): Promise<AdminProperty> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const all = await this.getAll();
    const prop = all.find((p) => p.id === id);
    if (!prop) throw new Error('Property not found');

    const updated = await this.update(id, { status }, activeUser);

    let actionWord = `updated status of ${prop.propertyCode} to ${status}`;
    if (status === 'published') actionWord = `published Property ${prop.propertyCode}`;
    if (status === 'archived') actionWord = `archived Property ${prop.propertyCode}`;
    if (status === 'sold') actionWord = `marked Property ${prop.propertyCode} as Sold`;
    if (status === 'rented') actionWord = `marked Property ${prop.propertyCode} as Rented`;
    if (status === 'under_negotiation') actionWord = `set Property ${prop.propertyCode} status to "Under Negotiation"`;

    await logActivity({
      user: activeUser,
      action: actionWord,
      module: 'Properties',
    });
    return updated;
  },

  async setFeatured(id: string, featured: boolean, activeUser: string): Promise<AdminProperty> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const prop = await this.getById(id);
    if (!prop) throw new Error('Property not found');
    
    const updated = await this.update(id, { featured }, activeUser);
    await logActivity({
      user: activeUser,
      action: featured 
        ? `featured Property ${prop.propertyCode} ("${prop.title}")`
        : `unfeatured Property ${prop.propertyCode} ("${prop.title}")`,
      module: 'Properties',
    });
    return updated;
  },
};
