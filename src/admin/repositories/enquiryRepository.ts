import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { Enquiry, EnquiryStatus } from '../types/admin';

export const enquiryRepository = {
  async getAll(): Promise<Enquiry[]> {
    try {
      const res = await api.get('/admin/enquiries');
      const list: Enquiry[] = Array.isArray(res) ? res : res.data || [];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Enquiry | null> {
    try {
      const res = await api.get(`/admin/enquiries/${id}`);
      return res.data ?? res;
    } catch {
      return null;
    }
  },

  async create(data: Omit<Enquiry, 'id' | 'status' | 'priority' | 'createdAt' | 'updatedAt' | 'internalNotes'>): Promise<Enquiry> {
    const res = await api.post('/enquiries', data);
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async update(id: string, data: Partial<Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt'>>, activeUser: string): Promise<Enquiry> {
    const res = await api.patch(`/admin/enquiries/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async updateStatus(id: string, status: EnquiryStatus, activeUser: string): Promise<Enquiry> {
    const res = await api.patch(`/admin/enquiries/${id}`, { status });
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    return res.data ?? res;
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await api.delete(`/admin/enquiries/${id}`);
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  },
};
