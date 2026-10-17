import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { AdminService } from '../types/admin';

export const servicesRepository = {
  async getAll(): Promise<AdminService[]> {
    try {
      const res = await api.get('/admin/services');
      const list: AdminService[] = Array.isArray(res) ? res : res.data || [];
      return list.sort((a, b) => a.order - b.order);
    } catch {
      const pub = await api.get('/services');
      const list: AdminService[] = Array.isArray(pub) ? pub : pub.data || [];
      return list.sort((a, b) => a.order - b.order);
    }
  },

  async getEnabled(): Promise<AdminService[]> {
    const list = await this.getAll();
    return list.filter((s) => s.enabled);
  },

  async getById(id: string): Promise<AdminService | null> {
    const list = await this.getAll();
    return list.find((s) => s.id === id) ?? null;
  },

  async create(data: Omit<AdminService, 'id' | 'order'>, activeUser: string): Promise<AdminService> {
    const res = await api.post('/admin/services', data);
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async update(id: string, data: Partial<Omit<AdminService, 'id'>>, activeUser: string): Promise<AdminService> {
    const res = await api.put(`/admin/services/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await api.delete(`/admin/services/${id}`);
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  },

  async reorder(orderedIds: string[], activeUser: string): Promise<AdminService[]> {
    const res = await api.patch('/admin/services/reorder', { orderedIds });
    queryClient.invalidateQueries({ queryKey: ['services'] });
    const list: AdminService[] = Array.isArray(res) ? res : res.data || [];
    return list.sort((a, b) => a.order - b.order);
  },
};
