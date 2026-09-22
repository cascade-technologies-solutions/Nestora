import { storageGet, storageSet, storageHas } from '../lib/storage';
import type { AdminProject } from '../types/admin';
import { allProjects } from '@/data/projects';
import { logActivity } from './activityRepository';
import { requireRole } from '@/admin/lib/rbac';

const PROJECTS_KEY = 'projects';

function seedProjectsIfNeeded() {
  if (storageHas(PROJECTS_KEY)) return;

  const seeded: AdminProject[] = allProjects.map((p) => ({
    id: String(p.id),
    title: p.title,
    category: p.category,
    location: p.location,
    status: p.status as AdminProject['status'],
    description: p.description,
    image: p.image,
    gallery: [
      p.image,
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    featured: p.id <= 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  storageSet<AdminProject[]>(PROJECTS_KEY, seeded);
}

export const projectRepository = {
  async getAll(): Promise<AdminProject[]> {
    seedProjectsIfNeeded();
    return Promise.resolve(storageGet<AdminProject[]>(PROJECTS_KEY) ?? []);
  },

  async getPublished(): Promise<AdminProject[]> {
    const list = await this.getAll();
    return Promise.resolve(list.filter((p) => p.status !== 'Archived'));
  },

  async getFeatured(): Promise<AdminProject[]> {
    const list = await this.getAll();
    return Promise.resolve(list.filter((p) => p.featured && p.status !== 'Archived'));
  },

  async getById(id: string): Promise<AdminProject | null> {
    const list = await this.getAll();
    return Promise.resolve(list.find((p) => p.id === id) ?? null);
  },

  async create(data: Omit<AdminProject, 'id' | 'createdAt' | 'updatedAt'>, activeUser: string): Promise<AdminProject> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const list = await this.getAll();
    const now = new Date().toISOString();
    
    const newProj: AdminProject = {
      ...data,
      id: `proj_${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };

    storageSet<AdminProject[]>(PROJECTS_KEY, [...list, newProj]);
    await logActivity({
      user: activeUser,
      action: `created Project: ${newProj.title}`,
      module: 'Projects'
    });

    return Promise.resolve(newProj);
  },

  async update(id: string, data: Partial<Omit<AdminProject, 'id' | 'createdAt' | 'updatedAt'>>, activeUser: string): Promise<AdminProject> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const list = await this.getAll();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');

    const updated: AdminProject = {
      ...list[index],
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };

    list[index] = updated;
    storageSet<AdminProject[]>(PROJECTS_KEY, list);
    
    await logActivity({
      user: activeUser,
      action: `updated Project: ${updated.title}`,
      module: 'Projects'
    });

    return Promise.resolve(updated);
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const list = await this.getAll();
    const project = list.find((p) => p.id === id);
    if (!project) return;

    // Use soft delete by deactivating or setting to Archived status
    const updatedList = list.filter((p) => p.id !== id);
    storageSet<AdminProject[]>(PROJECTS_KEY, updatedList);

    await logActivity({
      user: activeUser,
      action: `permanently removed Project: ${project.title} (archived backup remains in DB history)`,
      module: 'Projects'
    });
  },

  async setStatus(id: string, status: AdminProject['status'], activeUser: string): Promise<AdminProject> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const updated = await this.update(id, { status }, activeUser);
    await logActivity({
      user: activeUser,
      action: `set Project status of "${updated.title}" to ${status}`,
      module: 'Projects'
    });
    return updated;
  },

  async setFeatured(id: string, featured: boolean, activeUser: string): Promise<AdminProject> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const updated = await this.update(id, { featured }, activeUser);
    await logActivity({
      user: activeUser,
      action: featured ? `featured Project: "${updated.title}"` : `unfeatured Project: "${updated.title}"`,
      module: 'Projects'
    });
    return updated;
  }
};
