import { storageGet, storageSet, storageHas } from '../lib/storage';
import type { Enquiry, EnquiryStatus, EnquiryPriority } from '../types/admin';
import { logActivity } from './activityRepository';

const ENQUIRIES_KEY = 'enquiries';

const SEED_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq_1',
    type: 'contact',
    name: 'Akash Patil',
    email: 'akash@gmail.com',
    phone: '+91 99011 22334',
    message: 'I am interested in get structural waterproofing done for my warehouse on Gokul Road. Please contact me.',
    status: 'New',
    priority: 'High',
    internalNotes: 'Needs urgent reply because seepage is major.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'enq_2',
    type: 'property',
    name: 'Sharan Patil',
    email: 'sharan@patil.com',
    phone: '+91 98860 12345',
    message: 'Hello, is the "Modern Minimalist Villa" in Vidyanagar still available for negotiation?',
    propertyId: '1', // Modern Minimalist Villa
    status: 'Site Visit',
    priority: 'Medium',
    assignedTo: 'emp_superadmin',
    internalNotes: 'Client visited the site yesterday. They liked the structure, waiting for financial verification.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

function seedEnquiriesIfNeeded() {
  if (storageHas(ENQUIRIES_KEY)) return;
  storageSet<Enquiry[]>(ENQUIRIES_KEY, SEED_ENQUIRIES);
}

export const enquiryRepository = {
  async getAll(): Promise<Enquiry[]> {
    seedEnquiriesIfNeeded();
    const list = storageGet<Enquiry[]>(ENQUIRIES_KEY) ?? [];
    return Promise.resolve(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  },

  async getById(id: string): Promise<Enquiry | null> {
    const list = await this.getAll();
    return Promise.resolve(list.find((e) => e.id === id) ?? null);
  },

  async create(data: Omit<Enquiry, 'id' | 'status' | 'priority' | 'createdAt' | 'updatedAt' | 'internalNotes'>): Promise<Enquiry> {
    seedEnquiriesIfNeeded();
    const list = await this.getAll();
    const now = new Date().toISOString();
    
    const newEnq: Enquiry = {
      ...data,
      id: `enq_${Date.now()}`,
      status: 'New',
      priority: 'Medium',
      internalNotes: '',
      createdAt: now,
      updatedAt: now
    };

    storageSet<Enquiry[]>(ENQUIRIES_KEY, [newEnq, ...list]);
    
    // Log in activity repository anonymously or as public
    await logActivity({
      user: 'Public Visitor',
      action: `submitted a new ${data.type} enquiry (Assigned ID: ${newEnq.id})`,
      module: 'Enquiries'
    });

    return Promise.resolve(newEnq);
  },

  async update(id: string, data: Partial<Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt'>>, activeUser: string): Promise<Enquiry> {
    const list = await this.getAll();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Enquiry not found');

    const updated: Enquiry = {
      ...list[index],
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };

    list[index] = updated;
    storageSet<Enquiry[]>(ENQUIRIES_KEY, list);

    await logActivity({
      user: activeUser,
      action: `updated Enquiry record of ${updated.name}`,
      module: 'Enquiries'
    });

    return Promise.resolve(updated);
  },

  async updateStatus(id: string, status: EnquiryStatus, activeUser: string): Promise<Enquiry> {
    const list = await this.getAll();
    const enq = list.find((e) => e.id === id);
    if (!enq) throw new Error('Enquiry not found');

    const updated = await this.update(id, { status }, activeUser);

    await logActivity({
      user: activeUser,
      action: `updated status of Enquiry ${enq.id} to "${status}"`,
      module: 'Enquiries'
    });

    return updated;
  },

  async delete(id: string, activeUser: string): Promise<void> {
    const list = await this.getAll();
    const enq = list.find((e) => e.id === id);
    if (!enq) return;

    const filtered = list.filter((e) => e.id !== id);
    storageSet<Enquiry[]>(ENQUIRIES_KEY, filtered);

    await logActivity({
      user: activeUser,
      action: `deleted Enquiry submitted by ${enq.name}`,
      module: 'Enquiries'
    });
  }
};
