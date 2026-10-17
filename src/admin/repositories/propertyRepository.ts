import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { AdminProperty, PropertyStatus } from '../types/admin';

export const propertyRepository = {
  async getAll(): Promise<AdminProperty[]> {
    try {
      const res = await api.get('/admin/properties');
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      // Fallback to public properties if unauthenticated
      const pub = await api.get('/properties');
      return Array.isArray(pub) ? pub : pub.data || [];
    }
  },

  async getPublished(): Promise<AdminProperty[]> {
    const res = await api.get('/properties');
    return Array.isArray(res) ? res : res.data || [];
  },

  async getFeatured(): Promise<AdminProperty[]> {
    const res = await api.get('/properties?featured=true');
    return Array.isArray(res) ? res : res.data || [];
  },

  async getById(id: string): Promise<AdminProperty | null> {
    try {
      const res = await api.get(`/admin/properties/${id}`);
      return res.data ?? res;
    } catch {
      try {
        const pub = await api.get(`/properties/${id}`);
        return pub.data ?? pub;
      } catch {
        return null;
      }
    }
  },

  async getByCode(code: string): Promise<AdminProperty | null> {
    const all = await this.getAll();
    return all.find((p) => p.propertyCode.toLowerCase() === code.toLowerCase()) ?? null;
  },

  async create(
    data: Omit<AdminProperty, 'id' | 'propertyCode' | 'createdAt' | 'updatedAt'>,
    activeUser: string
  ): Promise<AdminProperty> {
    const res = await api.post('/admin/properties', data);
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async update(id: string, data: Partial<AdminProperty>, activeUser: string): Promise<AdminProperty> {
    const res = await api.put(`/admin/properties/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await api.delete(`/admin/properties/${id}`);
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  },

  async setStatus(id: string, status: PropertyStatus, activeUser: string): Promise<AdminProperty> {
    const res = await api.patch(`/admin/properties/${id}/status`, { status });
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async setFeatured(id: string, featured: boolean, activeUser: string): Promise<AdminProperty> {
    const res = await api.patch(`/admin/properties/${id}/featured`, { featured });
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    return res.data ?? res;
  },
};
