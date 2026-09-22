import { storageGet, storageSet } from '../lib/storage';
import type { HomepageCMS } from '../types/admin';
import { logActivity } from './activityRepository';

const HOMEPAGE_KEY = 'homepage_cms';

const DEFAULT_HOMEPAGE: HomepageCMS = {
  heroHeading: 'BUILD.\nRESTORE.\nDEVELOP.',
  heroDescription:
    'From renovation and waterproofing to construction, fabrication, earthmoving and real estate — complete technical execution and property solutions under one roof.',
  heroImages: [
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  ],
  ctaButtons: [
    { label: 'Explore Our Services', href: '/services', variant: 'primary' },
    { label: 'Discuss Your Project', href: '/contact', variant: 'secondary' },
  ],
  aboutHeading: 'Complete Solutions. One Trusted Team.',
  aboutText1: 'Nestora handles multi-service technical works across renovation, repair, construction, waterproofing, metal fabrication, earthmoving, and property support services. We offer complete project execution and property assistance under one roof, backed by an execution-focused engineering team.',
  aboutText2: 'We eliminate coordination challenges by unifying construction management, quality-oriented material selections, and municipal process assistance, ensuring your project is completed with transparency.',
  aboutImage: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  updatedAt: new Date().toISOString(),
};

export const homepageRepository = {
  async get(): Promise<HomepageCMS> {
    const stored = storageGet<HomepageCMS>(HOMEPAGE_KEY);
    return Promise.resolve(stored ?? DEFAULT_HOMEPAGE);
  },

  async save(data: Omit<HomepageCMS, 'updatedAt'>, activeUser: string): Promise<HomepageCMS> {
    const saved: HomepageCMS = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    storageSet<HomepageCMS>(HOMEPAGE_KEY, saved);
    await logActivity({
      user: activeUser,
      action: 'updated Website CMS homepage contents',
      module: 'Website CMS',
    });
    return Promise.resolve(saved);
  },

  getDefault(): HomepageCMS {
    return { ...DEFAULT_HOMEPAGE };
  },
};
