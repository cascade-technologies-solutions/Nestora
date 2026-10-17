import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { MediaAsset } from '../types/admin';

export const mediaRepository = {
  async getAll(): Promise<MediaAsset[]> {
    try {
      const res = await api.get('/admin/media');
      const list: MediaAsset[] = Array.isArray(res) ? res : res.data || [];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },

  async uploadFile(file: File, folder: string = 'general'): Promise<MediaAsset> {
    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('file', file);
    const res = await api.post('/admin/media/upload', formData);
    queryClient.invalidateQueries({ queryKey: ['media'] });
    const asset = res?.asset || res;
    return asset;
  },

  async add(name: string, url: string, size: number, activeUser: string): Promise<MediaAsset> {
    // If upload is done directly via FormData endpoint in MediaLibraryModal, asset is already in DB.
    // If added manually via URL:
    try {
      const all = await this.getAll();
      const existing = all.find((a) => a.url === url);
      if (existing) return existing;
    } catch {
      // Continue
    }

    queryClient.invalidateQueries({ queryKey: ['media'] });
    return {
      id: `media_${Date.now()}`,
      name,
      url,
      size,
      createdAt: new Date().toISOString(),
    };
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await api.delete(`/admin/media/${id}?force=true`);
    queryClient.invalidateQueries({ queryKey: ['media'] });
  },

  async rename(id: string, newName: string, activeUser: string): Promise<void> {
    await api.patch(`/admin/media/${id}/rename`, { name: newName });
    queryClient.invalidateQueries({ queryKey: ['media'] });
  },

  async replace(id: string, newUrl: string, newSize: number, activeUser: string): Promise<void> {
    // Media replace endpoint
    queryClient.invalidateQueries({ queryKey: ['media'] });
  },
};
