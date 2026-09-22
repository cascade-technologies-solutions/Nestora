import { storageGet, storageSet, storageHas } from '../lib/storage';
import type { AdminService } from '../types/admin';
import { logActivity } from './activityRepository';

const SERVICES_KEY = 'services';

const SEED_SERVICES: AdminService[] = [
  {
    id: 'construction',
    title: 'Construction Works',
    description: 'Dependable residential, commercial and general construction services. We manage the entire lifecycle of structures from planning and design alignment through to structural engineering and final execution.',
    icon: 'Building',
    color: 'bg-blue-600',
    enabled: true,
    order: 1,
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    workTypes: [
      'Residential construction',
      'Commercial construction',
      'Civil works',
      'Structural works',
      'Project execution',
      'Site development'
    ]
  },
  {
    id: 'renovation',
    title: 'Renovation & Repair Works',
    description: 'Complete upgrades, layout remodelling, structural restorations, and repairs. We restore older premises, enhance modern spaces, and rectify structural defects to increase structural durability.',
    icon: 'Wrench',
    color: 'bg-amber-600',
    enabled: true,
    order: 2,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    workTypes: [
      'Home renovation',
      'Commercial renovation',
      'Structural repairs',
      'Interior upgrades',
      'Property restoration',
      'Remodelling'
    ]
  },
  {
    id: 'waterproofing',
    title: 'Waterproofing Solutions',
    description: 'Advanced chemical, membrane, and injection systems to block seepages. We protect surfaces, basements, terraces, and walls from water damage, dampness, and concrete corrosion.',
    icon: 'ShieldCheck',
    color: 'bg-cyan-600',
    enabled: true,
    order: 3,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    workTypes: [
      'Terrace waterproofing',
      'Roof waterproofing',
      'Bathroom waterproofing',
      'Wall seepage solutions',
      'Structural waterproofing'
    ]
  },
  {
    id: 'fabrication',
    title: 'Fabrication Works',
    description: 'Custom metalwork, heavy iron framing, and metal installation. We fabricate architectural components, gates, structural supports, and safety enclosures to exact tolerances.',
    icon: 'Hammer',
    color: 'bg-slate-600',
    enabled: true,
    order: 4,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    workTypes: [
      'Structural fabrication',
      'Metal works',
      'Custom fabrication',
      'Gates & Grills',
      'Heavy iron framing'
    ]
  },
  {
    id: 'earthmoving',
    title: 'Earthmoving & Site Development',
    description: 'Bulk land preparation, excavations, structural filling, levelling, compaction, and clearing. Supported by heavy-duty earthmoving equipment to prepare construction-ready sites.',
    icon: 'Truck',
    color: 'bg-emerald-600',
    enabled: true,
    order: 5,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    workTypes: [
      'Excavation works',
      'Land levelling',
      'Site clearing',
      'Soil compaction',
      'Bulk earthmoving'
    ]
  },
  {
    id: 'realestate',
    title: 'Real Estate Services',
    description: 'Property search support, official evaluations, verified listing views, and layout support for commercial, residential and agriculture properties across Hubli-Dharwad.',
    icon: 'Home',
    color: 'bg-indigo-600',
    enabled: true,
    order: 6,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    workTypes: [
      'Property listings',
      'Verified plots & land',
      'Commercial layouts',
      'Documentation support',
      'Transaction clearance'
    ]
  },
  {
    id: 'corporation',
    title: 'Corporation Official Works',
    description: 'Municipal clearances, corporation tax evaluation, documentation, layout approvals, structural plan validations, and municipal liaison support services under expert guidance.',
    icon: 'FileText',
    color: 'bg-violet-600',
    enabled: true,
    order: 7,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    workTypes: [
      'Corporation approvals',
      'Layout validation',
      'Plan clearance liaison',
      'Property taxation filing',
      'Municipal applications'
    ]
  }
];

function seedServicesIfNeeded() {
  if (storageHas(SERVICES_KEY)) return;
  storageSet<AdminService[]>(SERVICES_KEY, SEED_SERVICES);
}

export const servicesRepository = {
  async getAll(): Promise<AdminService[]> {
    seedServicesIfNeeded();
    const list = storageGet<AdminService[]>(SERVICES_KEY) ?? [];
    return Promise.resolve(list.sort((a, b) => a.order - b.order));
  },

  async getEnabled(): Promise<AdminService[]> {
    const list = await this.getAll();
    return Promise.resolve(list.filter((s) => s.enabled));
  },

  async getById(id: string): Promise<AdminService | null> {
    const list = await this.getAll();
    return Promise.resolve(list.find((s) => s.id === id) ?? null);
  },

  async create(data: Omit<AdminService, 'id' | 'order'>, activeUser: string): Promise<AdminService> {
    const list = await this.getAll();
    const maxOrder = list.reduce((max, s) => (s.order > max ? s.order : max), 0);
    
    const newService: AdminService = {
      ...data,
      id: `service_${Date.now()}`,
      order: maxOrder + 1
    };

    storageSet<AdminService[]>(SERVICES_KEY, [...list, newService]);
    await logActivity({
      user: activeUser,
      action: `created Service: ${newService.title}`,
      module: 'Services'
    });

    return Promise.resolve(newService);
  },

  async update(id: string, data: Partial<Omit<AdminService, 'id'>>, activeUser: string): Promise<AdminService> {
    const list = await this.getAll();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Service not found');

    const updated: AdminService = {
      ...list[index],
      ...data,
      id
    };

    list[index] = updated;
    storageSet<AdminService[]>(SERVICES_KEY, list);
    
    await logActivity({
      user: activeUser,
      action: `updated Service: ${updated.title}`,
      module: 'Services'
    });

    return Promise.resolve(updated);
  },

  async delete(id: string, activeUser: string): Promise<void> {
    const list = await this.getAll();
    const service = list.find((s) => s.id === id);
    if (!service) return;

    const filtered = list.filter((s) => s.id !== id);
    // Recalculate order numbers
    const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    storageSet<AdminService[]>(SERVICES_KEY, reordered);

    await logActivity({
      user: activeUser,
      action: `permanently removed Service: ${service.title}`,
      module: 'Services'
    });
  },

  async reorder(orderedIds: string[], activeUser: string): Promise<AdminService[]> {
    const list = await this.getAll();
    const reorderedList = orderedIds.map((id, index) => {
      const original = list.find((s) => s.id === id);
      if (!original) throw new Error(`Service ${id} not found in database`);
      return {
        ...original,
        order: index + 1
      };
    });

    // Handle any services that weren't in the orderedIds list
    const remaining = list.filter((s) => !orderedIds.includes(s.id));
    let nextOrder = reorderedList.length + 1;
    remaining.forEach((s) => {
      reorderedList.push({ ...s, order: nextOrder++ });
    });

    storageSet<AdminService[]>(SERVICES_KEY, reorderedList);
    await logActivity({
      user: activeUser,
      action: `reordered Services list`,
      module: 'Services'
    });

    return Promise.resolve(reorderedList.sort((a, b) => a.order - b.order));
  }
};
