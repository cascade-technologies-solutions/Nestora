import { storageGet, storageSet } from '../lib/storage';
import type { SiteSettings } from '../types/admin';
import { CONFIG } from '@/config';
import { logActivity } from './activityRepository';

const SETTINGS_KEY = 'site_settings';

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
    const stored = storageGet<SiteSettings>(SETTINGS_KEY);
    return Promise.resolve(stored ?? DEFAULT_SETTINGS);
  },

  async save(data: Omit<SiteSettings, 'updatedAt'>, activeUser: string): Promise<SiteSettings> {
    const saved: SiteSettings = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    storageSet<SiteSettings>(SETTINGS_KEY, saved);
    await logActivity({
      user: activeUser,
      action: 'updated company contact and footer details',
      module: 'Website CMS',
    });
    return Promise.resolve(saved);
  },

  getDefault(): SiteSettings {
    return { ...DEFAULT_SETTINGS };
  },
};
