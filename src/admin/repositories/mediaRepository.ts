import { storageGet, storageSet, storageHas } from '../lib/storage';
import type { MediaAsset } from '../types/admin';
import { logActivity } from './activityRepository';
import { requireRole } from '@/admin/lib/rbac';

const MEDIA_KEY = 'media_assets';

const SEED_MEDIA: MediaAsset[] = [
  {
    id: 'media_1',
    name: 'commercial_architecture.jpg',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    size: 245800,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
  },
  {
    id: 'media_2',
    name: 'villa_exterior.jpg',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    size: 512400,
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
  },
  {
    id: 'media_3',
    name: 'construction_planning.jpg',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    size: 389200,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'media_4',
    name: 'modern_condo.jpg',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    size: 425600,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'media_5',
    name: 'steel_engineering.jpg',
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    size: 618400,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

function seedMediaIfNeeded() {
  if (storageHas(MEDIA_KEY)) return;
  storageSet<MediaAsset[]>(MEDIA_KEY, SEED_MEDIA);
}

export const mediaRepository = {
  async getAll(): Promise<MediaAsset[]> {
    seedMediaIfNeeded();
    const assets = storageGet<MediaAsset[]>(MEDIA_KEY) ?? [];
    return Promise.resolve(assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  },

  async add(name: string, url: string, size: number, activeUser: string): Promise<MediaAsset> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    seedMediaIfNeeded();
    const list = await this.getAll();
    const newAsset: MediaAsset = {
      id: `media_${Date.now()}`,
      name,
      url,
      size,
      createdAt: new Date().toISOString()
    };

    storageSet<MediaAsset[]>(MEDIA_KEY, [newAsset, ...list]);
    
    await logActivity({
      user: activeUser,
      action: `uploaded media file "${name}" to Library`,
      module: 'Media Library'
    });

    return Promise.resolve(newAsset);
  },

  async delete(id: string, activeUser: string): Promise<void> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const list = await this.getAll();
    const asset = list.find((a) => a.id === id);
    if (!asset) return;

    const filtered = list.filter((a) => a.id !== id);
    storageSet<MediaAsset[]>(MEDIA_KEY, filtered);

    await logActivity({
      user: activeUser,
      action: `deleted media file "${asset.name}" from Library`,
      module: 'Media Library'
    });
  },

  async rename(id: string, newName: string, activeUser: string): Promise<void> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const list = await this.getAll();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return;
    const oldName = list[index].name;
    list[index].name = newName;
    storageSet<MediaAsset[]>(MEDIA_KEY, list);

    await logActivity({
      user: activeUser,
      action: `renamed media "${oldName}" to "${newName}"`,
      module: 'Media Library'
    });
  },

  async replace(id: string, newUrl: string, newSize: number, activeUser: string): Promise<void> {
    await requireRole(activeUser, ['Admin', 'Super Admin']);
    const list = await this.getAll();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return;
    list[index].url = newUrl;
    list[index].size = newSize;
    list[index].createdAt = new Date().toISOString();
    storageSet<MediaAsset[]>(MEDIA_KEY, list);

    await logActivity({
      user: activeUser,
      action: `replaced media data of "${list[index].name}"`,
      module: 'Media Library'
    });
  }
};
