import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { AdminProject } from '../types/admin';

export const projectRepository = {
  async getAll(): Promise<AdminProject[]> {
    try {
      const res = await api.get('/admin/projects');
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      const pub = await api.get('/projects');
      return Array.isArray(pub) ? pub : pub.data || [];
    }
  },

  async getPublished(): Promise<AdminProject[]> {
    const res = await api.get('/projects');
    const list: AdminProject[] = Array.isArray(res) ? res : res.data || [];
    return list.filter((p) => p.status !== 'Archived');
  },

  async getFeatured(): Promise<AdminProject[]> {
    const res = await api.get('/projects?featured=true');
    const list: AdminProject[] = Array.isArray(res) ? res : res.data || [];
    return list.filter((p) => p.featured && p.status !== 'Archived');
  },

  async getById(id: string): Promise<AdminProject | null> {
    try {
      const res = await api.get(`/admin/projects/${id}`);
      return res.data ?? res;
    } catch {
      try {
        const pub = await api.get(`/projects/${id}`);
        return pub.data ?? pub;
      } catch {
        return null;
      }
    }
  },

  async create(data: Omit<AdminProject, 'id' | 'createdAt' | 'updatedAt'>, activeUser: string): Promise<AdminProject> {
    const res = await api.post('/admin/projects', data);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async update(id: string, data: Partial<Omit<AdminProject, 'id' | 'createdAt' | 'updatedAt'>>, activeUser: string): Promise<AdminProject> {
    const res = await api.put(`/admin/projects/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await api.delete(`/admin/projects/${id}`);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  },

  async setStatus(id: string, status: AdminProject['status'], activeUser: string): Promise<AdminProject> {
    const updated = await this.update(id, { status }, activeUser);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    return updated;
  },

  async setFeatured(id: string, featured: boolean, activeUser: string): Promise<AdminProject> {
    const updated = await this.update(id, { featured }, activeUser);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    return updated;
  },
};
