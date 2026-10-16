import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { SiteSettings } from '../types/admin';
import { CONFIG } from '@/config';

const DEFAULT_SETTINGS: SiteSettings = {
  companyName: 'NestoraHub',
  logoUrl: '',
  phone: CONFIG.CONTACT_PHONE,
  email: CONFIG.CONTACT_EMAIL,
  address: CONFIG.OFFICE_ADDRESS,
  whatsapp: CONFIG.WHATSAPP_PHONE,
  whatsappCommunityUrl: CONFIG.WHATSAPP_COMMUNITY_URL,
  socialLinks: {
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
  },
  footerTagline:
    'From renovation and waterproofing to construction, fabrication, earthmoving, and real estate – complete engineering and project solutions under one roof.',
  updatedAt: new Date().toISOString(),
};

export const settingsRepository = {
  async get(): Promise<SiteSettings> {
    try {
      const res = await api.get('/admin/settings');
      const data = res?.data ?? res;
      return {
        ...DEFAULT_SETTINGS,
        ...data,
      };
    } catch {
      try {
        const pub = await api.get('/settings');
        const data = pub?.data ?? pub;
        return {
          ...DEFAULT_SETTINGS,
          ...data,
        };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
  },

  async save(data: Omit<SiteSettings, 'updatedAt'>, activeUser: string): Promise<SiteSettings> {
    const res = await api.put('/admin/settings', data);
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    const saved = res?.data ?? res;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      updatedAt: new Date().toISOString(),
    };
  },

  getDefault(): SiteSettings {
    return { ...DEFAULT_SETTINGS };
  },
};
