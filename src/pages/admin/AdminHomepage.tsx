import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { homepageRepository } from '@/admin/repositories/homepageRepository';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { HomepageCMS, SiteSettings, CTAButton } from '@/admin/types/admin';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Plus, Trash2, Loader2, Save, Sparkles, Phone, MessageSquare, ShieldCheck, Hammer, HelpCircle, Images, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// ── Schemes for individual sections ───────────────────────────────────────────
const heroSchema = z.object({
  heroHeading: z.string().min(3, 'Heading is required'),
  heroDescription: z.string().min(10, 'Description must be at least 10 characters'),
  heroImages: z.array(z.string().min(1, 'Image URL is required')).min(1, 'At least one image is required'),
  ctaButtons: z.array(z.object({
    label: z.string().min(1, 'Label is required'),
    href: z.string().min(1, 'Link is required'),
    variant: z.enum(['primary', 'secondary', 'whatsapp']),
  })),
});

const aboutSchema = z.object({
  aboutHeading: z.string().min(3, 'Heading is required'),
  aboutText1: z.string().min(10, 'About text block 1 must be detailed'),
  aboutText2: z.string().min(10, 'About text block 2 must be detailed'),
  aboutImage: z.string().min(1, 'Image URL is required'),
});

const contactSchema = z.object({
  phone: z.string().min(5, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address is required'),
});

const brandSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  logoUrl: z.string().optional(),
});

const footerSchema = z.object({
  footerTagline: z.string().min(10, 'Footer tagline must be descriptive'),
  whatsapp: z.string().min(5, 'WhatsApp number is required'),
  whatsappCommunityUrl: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }),
});

type HeroFormValues = z.infer<typeof heroSchema>;
type AboutFormValues = z.infer<typeof aboutSchema>;
type ContactFormValues = z.infer<typeof contactSchema>;
type BrandFormValues = z.infer<typeof brandSchema>;
type FooterFormValues = z.infer<typeof footerSchema>;

const AdminHomepage = () => {
  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<HomepageCMS | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  // Media Library target
  const [mediaTarget, setMediaTarget] = useState<{ type: 'hero' | 'about' | 'brand'; index?: number } | null>(null);

  // Forms
  const [heroSaving, setHeroSaving] = useState(false);
  const {
    register: regHero,
    handleSubmit: subHero,
    formState: { errors: errHero, isDirty: dirtyHero },
    reset: resetHero,
    control: ctrlHero,
    watch: watchHero,
    setValue: setValHero
  } = useForm<HeroFormValues>({ resolver: zodResolver(heroSchema) });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: ctrlHero,
    name: 'heroImages' as never
  });

  const { fields: btnFields, append: appendBtn, remove: removeBtn } = useFieldArray({
    control: ctrlHero,
    name: 'ctaButtons'
  });

  const [aboutSaving, setAboutSaving] = useState(false);
  const {
    register: regAbout,
    handleSubmit: subAbout,
    formState: { errors: errAbout, isDirty: dirtyAbout },
    reset: resetAbout,
    watch: watchAbout,
    setValue: setValAbout
  } = useForm<AboutFormValues>({ resolver: zodResolver(aboutSchema) });

  const [contactSaving, setContactSaving] = useState(false);
  const {
    register: regContact,
    handleSubmit: subContact,
    formState: { errors: errContact, isDirty: dirtyContact },
    reset: resetContact
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const [brandSaving, setBrandSaving] = useState(false);
  const {
    register: regBrand,
    handleSubmit: subBrand,
    formState: { errors: errBrand, isDirty: dirtyBrand },
    reset: resetBrand,
    watch: watchBrand,
    setValue: setValBrand
  } = useForm<BrandFormValues>({ resolver: zodResolver(brandSchema) });

  const [footerSaving, setFooterSaving] = useState(false);
  const {
    register: regFooter,
    handleSubmit: subFooter,
    formState: { errors: errFooter, isDirty: dirtyFooter },
    reset: resetFooter
  } = useForm<FooterFormValues>({ resolver: zodResolver(footerSchema) });

  const loadData = async () => {
    const [cmsData, settingsData] = await Promise.all([
      homepageRepository.get(),
      settingsRepository.get()
    ]);

    setCms(cmsData);
    setSettings(settingsData);

    resetHero({
      heroHeading: cmsData.heroHeading,
      heroDescription: cmsData.heroDescription,
      heroImages: cmsData.heroImages,
      ctaButtons: cmsData.ctaButtons
    });

    resetAbout({
      aboutHeading: cmsData.aboutHeading || 'Complete Solutions. One Trusted Team.',
      aboutText1: cmsData.aboutText1 || '',
      aboutText2: cmsData.aboutText2 || '',
      aboutImage: cmsData.aboutImage || ''
    });

    resetContact({
      phone: settingsData.phone,
      email: settingsData.email,
      address: settingsData.address
    });

    resetBrand({
      companyName: settingsData.companyName,
      logoUrl: settingsData.logoUrl
    });

    resetFooter({
      footerTagline: settingsData.footerTagline,
      whatsapp: settingsData.whatsapp,
      whatsappCommunityUrl: settingsData.whatsappCommunityUrl || '',
      socialLinks: settingsData.socialLinks
    });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Prevent leaving page with unsaved CMS changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyHero || dirtyAbout || dirtyContact || dirtyBrand || dirtyFooter) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your website CMS. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyHero, dirtyAbout, dirtyContact, dirtyBrand, dirtyFooter]);

  const handleSelectMedia = (url: string) => {
    if (!mediaTarget) return;
    if (mediaTarget.type === 'hero' && mediaTarget.index !== undefined) {
      setValHero(`heroImages.${mediaTarget.index}`, url, { shouldDirty: true });
    } else if (mediaTarget.type === 'about') {
      setValAbout('aboutImage', url, { shouldDirty: true });
    } else if (mediaTarget.type === 'brand') {
      setValBrand('logoUrl', url, { shouldDirty: true });
    }
    setMediaTarget(null);
  };

  // Section Save functions
  const saveHero = async (values: HeroFormValues) => {
    if (!cms) return;
    setHeroSaving(true);
    try {
      await homepageRepository.save({
        ...cms,
        heroHeading: values.heroHeading,
        heroDescription: values.heroDescription,
        heroImages: values.heroImages,
        ctaButtons: values.ctaButtons as CTAButton[]
      }, adminUser?.name || 'Admin');
      toast({ title: 'Hero Section Updated', description: 'Changes deployed to public homepage.' });
      loadData();
    } finally {
      setHeroSaving(false);
    }
  };

  const saveAbout = async (values: AboutFormValues) => {
    if (!cms) return;
    setAboutSaving(true);
    try {
      await homepageRepository.save({
        ...cms,
        aboutHeading: values.aboutHeading,
        aboutText1: values.aboutText1,
        aboutText2: values.aboutText2,
        aboutImage: values.aboutImage
      }, adminUser?.name || 'Admin');
      toast({ title: 'About Section Updated', description: 'Public content synchronized successfully.' });
      loadData();
    } finally {
      setAboutSaving(false);
    }
  };

  const saveContact = async (values: ContactFormValues) => {
    if (!settings) return;
    setContactSaving(true);
    try {
      await settingsRepository.save({
        ...settings,
        phone: values.phone,
        email: values.email,
        address: values.address
      }, adminUser?.name || 'Admin');
      toast({ title: 'Contact Details Updated', description: 'Header/Footer contact coordinates synchronized.' });
      loadData();
    } finally {
      setContactSaving(false);
    }
  };

  const saveBrand = async (values: BrandFormValues) => {
    if (!settings) return;
    setBrandSaving(true);
    try {
      await settingsRepository.save({
        ...settings,
        companyName: values.companyName,
        logoUrl: values.logoUrl || ''
      }, adminUser?.name || 'Admin');
      toast({ title: 'Branding Configuration Saved', description: 'Company name and header logo refreshed.' });
      loadData();
    } finally {
      setBrandSaving(false);
    }
  };

  const saveFooter = async (values: FooterFormValues) => {
    if (!settings) return;
    setFooterSaving(true);
    try {
      await settingsRepository.save({
        ...settings,
        footerTagline: values.footerTagline,
        whatsapp: values.whatsapp,
        whatsappCommunityUrl: values.whatsappCommunityUrl || '',
        socialLinks: {
          facebook: values.socialLinks.facebook || '',
          instagram: values.socialLinks.instagram || '',
          linkedin: values.socialLinks.linkedin || '',
          twitter: values.socialLinks.twitter || '',
        }
      }, adminUser?.name || 'Admin');
      toast({ title: 'Footer & Social Integrations Saved' });
      loadData();
    } finally {
      setFooterSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading website CMS segments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Description header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Website CMS Editor</h1>
        <p className="text-slate-500 text-xs mt-1">
          Customize corporate landing copy, contact links, footer taglines and WhatsApp community cards.
        </p>
      </div>

      {/* 1. HERO SECTION */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <form onSubmit={subHero(saveHero)}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" /> Hero Section Settings
              </h2>
              <div className="flex items-center gap-3">
                {dirtyHero && <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Unsaved Changes</span>}
                <Button type="submit" disabled={heroSaving || !dirtyHero} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-4 h-8 flex items-center gap-1.5">
                  {heroSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Hero
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Hero Main Title (Heading)</Label>
                <Input {...regHero('heroHeading')} className="bg-slate-850 border-slate-700 text-white text-xs" />
                {errHero.heroHeading && <p className="text-red-400 text-[10px] mt-1">{errHero.heroHeading.message}</p>}
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Hero Short Description</Label>
                <textarea {...regHero('heroDescription')} rows={3} className="w-full bg-slate-850 border border-slate-700 rounded-md p-3 text-xs text-white focus:outline-none focus:border-blue-500" />
                {errHero.heroDescription && <p className="text-red-400 text-[10px] mt-1">{errHero.heroDescription.message}</p>}
              </div>

              {/* Carousel Images */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-400 text-xs font-semibold">Carousel Images</Label>
                  <Button type="button" variant="ghost" onClick={() => appendImage('')} className="text-blue-400 hover:text-blue-300 text-[10px] uppercase font-bold flex gap-1 h-6 px-1.5">
                    <Plus className="w-3 h-3" /> Add Image Link
                  </Button>
                </div>
                {imageFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Input {...regHero(`heroImages.${idx}`)} className="bg-slate-850 border-slate-700 text-white text-xs flex-1" />
                    <Button type="button" onClick={() => setMediaTarget({ type: 'hero', index: idx })} className="bg-slate-800 hover:bg-slate-700 text-xs h-9">
                      Media Library
                    </Button>
                    {imageFields.length > 1 && (
                      <Button type="button" variant="ghost" onClick={() => removeImage(idx)} className="text-slate-500 hover:text-red-400 h-9 w-9 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-400 text-xs font-semibold">Call to Action (CTA) Buttons</Label>
                  <Button type="button" variant="ghost" onClick={() => appendBtn({ label: '', href: '/', variant: 'secondary' })} className="text-blue-400 hover:text-blue-300 text-[10px] uppercase font-bold flex gap-1 h-6 px-1.5">
                    <Plus className="w-3 h-3" /> Add Button
                  </Button>
                </div>
                {btnFields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-[2fr_2fr_1.5fr_auto] gap-2 items-center">
                    <Input {...regHero(`ctaButtons.${idx}.label`)} placeholder="Label" className="bg-slate-850 border-slate-700 text-white text-xs" />
                    <Input {...regHero(`ctaButtons.${idx}.href`)} placeholder="Link path" className="bg-slate-850 border-slate-700 text-white text-xs" />
                    <select
                      {...regHero(`ctaButtons.${idx}.variant`)}
                      className="bg-slate-850 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer h-9 w-full"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                    <Button type="button" variant="ghost" onClick={() => removeBtn(idx)} className="text-slate-500 hover:text-red-400 p-0 w-9 h-9">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* 2. ABOUT US SECTION */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <form onSubmit={subAbout(saveAbout)}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-purple-400" /> About Corporate Section Settings
              </h2>
              <div className="flex items-center gap-3">
                {dirtyAbout && <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Unsaved Changes</span>}
                <Button type="submit" disabled={aboutSaving || !dirtyAbout} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-4 h-8 flex items-center gap-1.5">
                  {aboutSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save About
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">About Main Heading</Label>
                <Input {...regAbout('aboutHeading')} className="bg-slate-850 border-slate-700 text-white text-xs" />
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">About Description Block 1</Label>
                <textarea {...regAbout('aboutText1')} rows={3} className="w-full bg-slate-850 border border-slate-700 rounded-md p-3 text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">About Description Block 2</Label>
                <textarea {...regAbout('aboutText2')} rows={3} className="w-full bg-slate-850 border border-slate-700 rounded-md p-3 text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-400 text-xs font-semibold">About Section Image</Label>
                  <Button type="button" size="xs" onClick={() => setMediaTarget({ type: 'about' })} className="bg-slate-800 border border-slate-700 text-white rounded text-xs py-1">
                    Media Library
                  </Button>
                </div>
                <Input {...regAbout('aboutImage')} className="bg-slate-850 border-slate-700 text-white text-xs" />
                {watchAbout().aboutImage && (
                  <div className="h-40 rounded-lg overflow-hidden border border-slate-850 bg-slate-950 mt-2">
                    <img src={watchAbout().aboutImage} alt="About preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* 3. CONTACT INFORMATION */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <form onSubmit={subContact(saveContact)}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-cyan-400" /> Company Contact Details
              </h2>
              <div className="flex items-center gap-3">
                {dirtyContact && <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Unsaved Changes</span>}
                <Button type="submit" disabled={contactSaving || !dirtyContact} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-4 h-8 flex items-center gap-1.5">
                  {contactSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Contact
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Phone Contact Number</Label>
                <Input {...regContact('phone')} className="bg-slate-855 border-slate-700 text-white text-xs" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Email Contact Address</Label>
                <Input {...regContact('email')} className="bg-slate-855 border-slate-700 text-white text-xs" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Physical Office Address</Label>
                <Input {...regContact('address')} className="bg-slate-855 border-slate-700 text-white text-xs" />
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* 4. BRAND CONFIGURATION */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <form onSubmit={subBrand(saveBrand)}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Hammer className="w-4 h-4 text-green-400" /> Company Brand Settings
              </h2>
              <div className="flex items-center gap-3">
                {dirtyBrand && <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Unsaved Changes</span>}
                <Button type="submit" disabled={brandSaving || !dirtyBrand} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-4 h-8 flex items-center gap-1.5">
                  {brandSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Branding
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Branded Corporate Name</Label>
                <Input {...regBrand('companyName')} className="bg-slate-850 border-slate-700 text-white text-xs" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-400 text-xs font-semibold">Branding Logo image</Label>
                  <Button type="button" size="xs" onClick={() => setMediaTarget({ type: 'brand' })} className="bg-slate-800 border-slate-700 text-white rounded text-xs py-1">
                    Media Library
                  </Button>
                </div>
                <Input {...regBrand('logoUrl')} placeholder="Logo URL..." className="bg-slate-850 border-slate-700 text-white text-xs" />
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* 5. FOOTER & SOCIAL PLUGINS */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <form onSubmit={subFooter(saveFooter)}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" /> Footer & Social Links Settings
              </h2>
              <div className="flex items-center gap-3">
                {dirtyFooter && <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Unsaved Changes</span>}
                <Button type="submit" disabled={footerSaving || !dirtyFooter} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-4 h-8 flex items-center gap-1.5">
                  {footerSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Footer
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Footer Company Tagline</Label>
                <textarea {...regFooter('footerTagline')} rows={2} className="w-full bg-slate-850 border border-slate-700 rounded-md p-3 text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 text-xs font-semibold mb-1 block">WhatsApp Contact Number</Label>
                  <Input {...regFooter('whatsapp')} placeholder="+919902676457" className="bg-slate-850 border-slate-700 text-white text-xs" />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs font-semibold mb-1 block">WhatsApp Community URL Link</Label>
                  <Input {...regFooter('whatsappCommunityUrl')} placeholder="https://chat.whatsapp.com/..." className="bg-slate-850 border-slate-700 text-white text-xs" />
                </div>
              </div>

              {/* Social Link Handles */}
              <div className="space-y-3 border-t border-slate-850 pt-4">
                <h4 className="text-xs font-bold text-slate-400">Social Accounts Handles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-450 text-[10px] uppercase font-bold block mb-1">Facebook</Label>
                    <Input {...regFooter('socialLinks.facebook')} className="bg-slate-850 border-slate-700 text-white text-xs" />
                  </div>
                  <div>
                    <Label className="text-slate-455 text-[10px] uppercase font-bold block mb-1">Instagram</Label>
                    <Input {...regFooter('socialLinks.instagram')} className="bg-slate-850 border-slate-700 text-white text-xs" />
                  </div>
                  <div>
                    <Label className="text-slate-455 text-[10px] uppercase font-bold block mb-1">LinkedIn</Label>
                    <Input {...regFooter('socialLinks.linkedin')} className="bg-slate-850 border-slate-700 text-white text-xs" />
                  </div>
                  <div>
                    <Label className="text-slate-455 text-[10px] uppercase font-bold block mb-1">Twitter / X</Label>
                    <Input {...regFooter('socialLinks.twitter')} className="bg-slate-850 border-slate-700 text-white text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* 6. WHY CHOOSE US (COMING SOON) */}
      <Card className="bg-slate-900 border-slate-800 text-white opacity-75">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-500" /> Why Choose Us Settings
            </h2>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5">
              Coming Soon
            </Badge>
          </div>
          <div className="py-2 text-xs text-slate-400 leading-relaxed">
            <p>This section is currently compiled from the static landing copy in the template. Dynamic CMS customization options for "Why Choose Us" cards will be enabled in the upcoming release.</p>
          </div>
        </CardContent>
      </Card>

      {/* 7. HOMEPAGE CTA (COMING SOON) */}
      <Card className="bg-slate-900 border-slate-800 text-white opacity-75">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" /> Homepage CTA Segment Settings
            </h2>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5">
              Coming Soon
            </Badge>
          </div>
          <div className="py-2 text-xs text-slate-400 leading-relaxed">
            <p>The "Discuss Your Project" final call-to-action banner is currently statically optimized. Custom content editing and theme button toggles will be introduced soon.</p>
          </div>
        </CardContent>
      </Card>

      {/* Shared Media library */}
      <MediaLibraryModal
        isOpen={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onSelect={handleSelectMedia}
        title="Select Website CMS Logo/Image"
      />
    </div>
  );
};

export default AdminHomepage;
