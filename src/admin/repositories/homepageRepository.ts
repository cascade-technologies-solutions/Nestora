import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { HomepageCMS } from '../types/admin';

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
  aboutText1:
    'Nestora handles multi-service technical works across renovation, repair, construction, waterproofing, metal fabrication, earthmoving, and property support services. We offer complete project execution and property assistance under one roof, backed by an execution-focused engineering team.',
  aboutText2:
    'We eliminate coordination challenges by unifying construction management, quality-oriented material selections, and municipal process assistance, ensuring your project is completed with transparency.',
  aboutImage:
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  updatedAt: new Date().toISOString(),
};

export const homepageRepository = {
  async get(): Promise<HomepageCMS> {
    try {
      const [heroRes, aboutRes] = await Promise.all([
        api.get('/cms/hero').catch(() => null),
        api.get('/cms/about').catch(() => null),
      ]);

      const hero = heroRes?.data ?? heroRes;
      const about = aboutRes?.data ?? aboutRes;

      if (!hero && !about) {
        return DEFAULT_HOMEPAGE;
      }

      return {
        heroHeading: hero?.heading ?? hero?.heroHeading ?? DEFAULT_HOMEPAGE.heroHeading,
        heroDescription: hero?.subheading ?? hero?.description ?? hero?.heroDescription ?? DEFAULT_HOMEPAGE.heroDescription,
        heroImages: hero?.backgroundImages ?? hero?.heroImages ?? DEFAULT_HOMEPAGE.heroImages,
        ctaButtons: hero?.ctaButtons ?? DEFAULT_HOMEPAGE.ctaButtons,
        aboutHeading: about?.heading ?? about?.aboutHeading ?? DEFAULT_HOMEPAGE.aboutHeading,
        aboutText1: about?.body1 ?? about?.aboutText1 ?? DEFAULT_HOMEPAGE.aboutText1,
        aboutText2: about?.body2 ?? about?.aboutText2 ?? DEFAULT_HOMEPAGE.aboutText2,
        aboutImage: about?.image ?? about?.aboutImage ?? DEFAULT_HOMEPAGE.aboutImage,
        updatedAt: hero?.updatedAt || about?.updatedAt || new Date().toISOString(),
      };
    } catch {
      return DEFAULT_HOMEPAGE;
    }
  },

  async save(data: Omit<HomepageCMS, 'updatedAt'>, activeUser: string): Promise<HomepageCMS> {
    const heroPayload = {
      heading: data.heroHeading,
      subheading: data.heroDescription,
      heroHeading: data.heroHeading,
      heroDescription: data.heroDescription,
      backgroundImages: data.heroImages,
      heroImages: data.heroImages,
      ctaButtons: data.ctaButtons,
      updatedAt: new Date().toISOString(),
    };

    const aboutPayload = {
      heading: data.aboutHeading,
      aboutHeading: data.aboutHeading,
      body1: data.aboutText1,
      body2: data.aboutText2,
      aboutText1: data.aboutText1,
      aboutText2: data.aboutText2,
      image: data.aboutImage,
      aboutImage: data.aboutImage,
      updatedAt: new Date().toISOString(),
    };

    await api.put('/admin/cms/bulk-update', {
      sections: {
        hero: heroPayload,
        about: aboutPayload,
      },
    });

    queryClient.invalidateQueries({ queryKey: ['cms'] });
    queryClient.invalidateQueries({ queryKey: ['homepage_cms'] });

    return {
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },

  getDefault(): HomepageCMS {
    return { ...DEFAULT_HOMEPAGE };
  },
};
