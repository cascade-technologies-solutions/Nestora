import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { homepageRepository } from '@/admin/repositories/homepageRepository';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { HomepageCMS, SiteSettings } from '@/admin/types/admin';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Save, Loader2, Plus, Trash2, Images, Globe, Phone, Facebook, Instagram,
  Linkedin, Twitter, MessageSquare, Building2, Link2, Image, Star, Info,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ── Schemas ────────────────────────────────────────────────────────────────────

const heroSchema = z.object({
  heroHeading: z.string().min(3, 'Heading is required'),
  heroDescription: z.string().min(10, 'Description must be at least 10 characters'),
  heroImages: z.array(z.object({ url: z.string().min(1, 'Image URL is required') })).min(1, 'At least one image is required'),
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

type SectionId = 'hero' | 'about' | 'contact' | 'brand' | 'footer';

// ── Section Wrapper Component ──────────────────────────────────────────────────

const CMSSection = ({
  id,
  title,
  icon,
  isDirty,
  isSaving,
  onSave,
  children,
}: {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  isDirty?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  children: React.ReactNode;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-900/80 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          {isDirty && (
            <Badge className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-800/60 px-2 py-0.5">
              Unsaved Changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && onSave && (
            <Button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 text-xs h-8 px-3"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving...' : 'Save Section'}
            </Button>
          )}
          {collapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>
      {!collapsed && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Main CMS Component ─────────────────────────────────────────────────────────

const AdminCMS = () => {
  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<HomepageCMS | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const [mediaTarget, setMediaTarget] = useState<{ type: 'hero' | 'about' | 'brand'; index?: number } | null>(null);

  // Saving state per section
  const [saving, setSaving] = useState<Record<SectionId, boolean>>({
    hero: false, about: false, contact: false, brand: false, footer: false
  });

  // ── Hero Form ────────────────────────────────────────────────────────────────
  const {
    register: regHero,
    handleSubmit: subHero,
    formState: { errors: errHero, isDirty: dirtyHero },
    reset: resetHero,
    control: ctrlHero,
    setValue: setValHero,
    watch: watchHero,
  } = useForm<HeroFormValues>({ resolver: zodResolver(heroSchema) });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: ctrlHero, name: 'heroImages'
  });
  const { fields: btnFields, append: appendBtn, remove: removeBtn } = useFieldArray({
    control: ctrlHero, name: 'ctaButtons'
  });

  // ── About Form ───────────────────────────────────────────────────────────────
  const {
    register: regAbout,
    handleSubmit: subAbout,
    formState: { errors: errAbout, isDirty: dirtyAbout },
    reset: resetAbout,
    watch: watchAbout,
    setValue: setValAbout,
  } = useForm<AboutFormValues>({ resolver: zodResolver(aboutSchema) });

  // ── Contact Form ─────────────────────────────────────────────────────────────
  const {
    register: regContact,
    handleSubmit: subContact,
    formState: { errors: errContact, isDirty: dirtyContact },
    reset: resetContact,
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  // ── Brand Form ───────────────────────────────────────────────────────────────
  const {
    register: regBrand,
    handleSubmit: subBrand,
    formState: { isDirty: dirtyBrand },
    reset: resetBrand,
    watch: watchBrand,
    setValue: setValBrand,
  } = useForm<BrandFormValues>({ resolver: zodResolver(brandSchema) });

  // ── Footer Form ──────────────────────────────────────────────────────────────
  const {
    register: regFooter,
    handleSubmit: subFooter,
    formState: { errors: errFooter, isDirty: dirtyFooter },
    reset: resetFooter,
  } = useForm<FooterFormValues>({ resolver: zodResolver(footerSchema) });

  // ── Load Data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [cmsData, settingsData] = await Promise.all([
        homepageRepository.get(),
        settingsRepository.get(),
      ]);
      setCms(cmsData);
      setSettings(settingsData);

      resetHero({
        heroHeading: cmsData.heroHeading,
        heroDescription: cmsData.heroDescription,
        heroImages: cmsData.heroImages.map(url => ({ url })),
        ctaButtons: cmsData.ctaButtons,
      });
      resetAbout({
        aboutHeading: cmsData.aboutHeading,
        aboutText1: cmsData.aboutText1,
        aboutText2: cmsData.aboutText2,
        aboutImage: cmsData.aboutImage,
      });
      resetContact({
        phone: settingsData.phone,
        email: settingsData.email,
        address: settingsData.address,
      });
      resetBrand({
        companyName: settingsData.companyName,
        logoUrl: settingsData.logoUrl || '',
      });
      resetFooter({
        footerTagline: settingsData.footerTagline,
        whatsapp: settingsData.whatsapp,
        whatsappCommunityUrl: settingsData.whatsappCommunityUrl || '',
        socialLinks: settingsData.socialLinks,
      });

      setLoading(false);
    };
    load();
  }, [resetHero, resetAbout, resetContact, resetBrand, resetFooter]);

  // ── Save handlers ─────────────────────────────────────────────────────────────

  const onSaveHero = subHero(async (values) => {
    setSaving(s => ({ ...s, hero: true }));
    try {
      const existing = await homepageRepository.get();
      await homepageRepository.save({
        ...existing,
        heroHeading: values.heroHeading,
        heroDescription: values.heroDescription,
        heroImages: values.heroImages.map(i => i.url),
        ctaButtons: values.ctaButtons,
      }, adminUser?.name || 'Admin');
      toast({ title: 'Hero section saved successfully.' });
      resetHero(values);
    } catch (err: any) {
      toast({ title: 'Failed to save hero', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(s => ({ ...s, hero: false }));
    }
  });

  const onSaveAbout = subAbout(async (values) => {
    setSaving(s => ({ ...s, about: true }));
    try {
      const existing = await homepageRepository.get();
      await homepageRepository.save({
        ...existing,
        aboutHeading: values.aboutHeading,
        aboutText1: values.aboutText1,
        aboutText2: values.aboutText2,
        aboutImage: values.aboutImage,
      }, adminUser?.name || 'Admin');
      toast({ title: 'About section saved successfully.' });
      resetAbout(values);
    } catch (err: any) {
      toast({ title: 'Failed to save about', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(s => ({ ...s, about: false }));
    }
  });

  const onSaveContact = subContact(async (values) => {
    setSaving(s => ({ ...s, contact: true }));
    try {
      const existing = await settingsRepository.get();
      await settingsRepository.save({
        ...existing,
        phone: values.phone,
        email: values.email,
        address: values.address,
      }, adminUser?.name || 'Admin');
      toast({ title: 'Contact details saved successfully.' });
      resetContact(values);
    } catch (err: any) {
      toast({ title: 'Failed to save contact', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(s => ({ ...s, contact: false }));
    }
  });

  const onSaveBrand = subBrand(async (values) => {
    setSaving(s => ({ ...s, brand: true }));
    try {
      const existing = await settingsRepository.get();
      await settingsRepository.save({
        ...existing,
        companyName: values.companyName,
        logoUrl: values.logoUrl || '',
      }, adminUser?.name || 'Admin');
      toast({ title: 'Brand assets saved successfully.' });
      resetBrand(values);
    } catch (err: any) {
      toast({ title: 'Failed to save brand', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(s => ({ ...s, brand: false }));
    }
  });

  const onSaveFooter = subFooter(async (values) => {
    setSaving(s => ({ ...s, footer: true }));
    try {
      const existing = await settingsRepository.get();
      await settingsRepository.save({
        ...existing,
        footerTagline: values.footerTagline,
        whatsapp: values.whatsapp,
        whatsappCommunityUrl: values.whatsappCommunityUrl || '',
        socialLinks: {
          facebook: values.socialLinks.facebook || '',
          instagram: values.socialLinks.instagram || '',
          linkedin: values.socialLinks.linkedin || '',
          twitter: values.socialLinks.twitter || '',
        },
      }, adminUser?.name || 'Admin');
      toast({ title: 'Footer & social links saved successfully.' });
      resetFooter(values);
    } catch (err: any) {
      toast({ title: 'Failed to save footer', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(s => ({ ...s, footer: false }));
    }
  });

  const handleSelectMedia = (url: string) => {
    if (!mediaTarget) return;
    if (mediaTarget.type === 'hero' && mediaTarget.index !== undefined) {
      setValHero(`heroImages.${mediaTarget.index}.url`, url, { shouldDirty: true });
    } else if (mediaTarget.type === 'about') {
      setValAbout('aboutImage', url, { shouldDirty: true });
    } else if (mediaTarget.type === 'brand') {
      setValBrand('logoUrl', url, { shouldDirty: true });
    }
    setMediaTarget(null);
  };

  const watchedHero = watchHero();
  const watchedAbout = watchAbout();
  const watchedBrand = watchBrand();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading CMS editor data...</p>
      </div>
    );
  }

  const inputClass = "bg-slate-850 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500";
  const textareaClass = "w-full bg-slate-855 border border-slate-700 rounded-md p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none";
  const labelClass = "text-slate-400 text-xs font-semibold mb-1.5 block";
  const errorClass = "text-red-400 text-[10px] mt-1";

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Website CMS Editor</h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage all website content independently. Each section saves separately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(dirtyHero || dirtyAbout || dirtyContact || dirtyBrand || dirtyFooter) && (
            <Badge className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-800/60 px-2 py-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> You have unsaved changes
            </Badge>
          )}
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs h-9 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Preview Site
            </Button>
          </a>
        </div>
      </div>

      {/* ── SECTION 1: Hero ──────────────────────────────────────────────────── */}
      <CMSSection
        id="hero"
        title="Hero Section"
        icon={<Star className="w-4 h-4" />}
        isDirty={dirtyHero}
        isSaving={saving.hero}
        onSave={onSaveHero}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className={labelClass}>Hero Heading *</Label>
            <Input
              {...regHero('heroHeading')}
              placeholder="BUILD.\nRESTORE.\nDEVELOP."
              className={inputClass}
            />
            {errHero.heroHeading && <p className={errorClass}>{errHero.heroHeading.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Label className={labelClass}>Hero Description *</Label>
            <textarea
              {...regHero('heroDescription')}
              rows={3}
              placeholder="Describe your services..."
              className={textareaClass}
            />
            {errHero.heroDescription && <p className={errorClass}>{errHero.heroDescription.message}</p>}
          </div>
        </div>

        {/* Hero Images */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <Label className={labelClass + " mb-0"}>Hero Slideshow Images *</Label>
            <Button
              type="button"
              onClick={() => appendImage({ url: '' })}
              className="bg-slate-800 text-white rounded-lg text-xs h-7 px-2 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Image
            </Button>
          </div>
          {imageFields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Input
                {...regHero(`heroImages.${idx}.url`)}
                placeholder={`Image ${idx + 1} URL...`}
                className={cn(inputClass, "flex-1 text-xs h-8")}
              />
              <Button
                type="button"
                onClick={() => setMediaTarget({ type: 'hero', index: idx })}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs h-8 px-2"
              >
                <Images className="w-3.5 h-3.5" />
              </Button>
              {watchedHero.heroImages?.[idx]?.url && (
                <div className="w-12 h-8 rounded overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                  <img src={watchedHero.heroImages[idx].url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {imageFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImage(idx)}
                  className="text-red-500 hover:bg-red-950/20 w-8 h-8"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <Label className={labelClass + " mb-0"}>Call-to-Action Buttons</Label>
            <Button
              type="button"
              onClick={() => appendBtn({ label: '', href: '', variant: 'primary' })}
              className="bg-slate-800 text-white rounded-lg text-xs h-7 px-2 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Button
            </Button>
          </div>
          {btnFields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-3 gap-2 bg-slate-850 p-3 rounded-lg border border-slate-800">
              <Input
                {...regHero(`ctaButtons.${idx}.label`)}
                placeholder="Button Label"
                className={cn(inputClass, "text-xs h-8")}
              />
              <Input
                {...regHero(`ctaButtons.${idx}.href`)}
                placeholder="/link-path"
                className={cn(inputClass, "text-xs h-8")}
              />
              <div className="flex gap-1.5">
                <Select
                  value={watchedHero.ctaButtons?.[idx]?.variant}
                  onValueChange={(v) => setValHero(`ctaButtons.${idx}.variant`, v as any, { shouldDirty: true })}
                >
                  <SelectTrigger className={cn(inputClass, "text-xs h-8 flex-1")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-850 border-slate-700">
                    <SelectItem value="primary" className="text-white text-xs focus:bg-slate-800">Primary</SelectItem>
                    <SelectItem value="secondary" className="text-white text-xs focus:bg-slate-800">Secondary</SelectItem>
                    <SelectItem value="whatsapp" className="text-white text-xs focus:bg-slate-800">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBtn(idx)}
                  className="text-red-500 hover:bg-red-950/20 w-8 h-8"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CMSSection>

      {/* ── SECTION 2: About ─────────────────────────────────────────────────── */}
      <CMSSection
        id="about"
        title="About Section"
        icon={<Info className="w-4 h-4" />}
        isDirty={dirtyAbout}
        isSaving={saving.about}
        onSave={onSaveAbout}
      >
        <div className="space-y-4">
          <div>
            <Label className={labelClass}>About Section Heading *</Label>
            <Input {...regAbout('aboutHeading')} placeholder="Complete Solutions. One Trusted Team." className={inputClass} />
            {errAbout.aboutHeading && <p className={errorClass}>{errAbout.aboutHeading.message}</p>}
          </div>
          <div>
            <Label className={labelClass}>About Text Block 1 *</Label>
            <textarea {...regAbout('aboutText1')} rows={4} placeholder="First paragraph about company..." className={textareaClass} />
            {errAbout.aboutText1 && <p className={errorClass}>{errAbout.aboutText1.message}</p>}
          </div>
          <div>
            <Label className={labelClass}>About Text Block 2 *</Label>
            <textarea {...regAbout('aboutText2')} rows={4} placeholder="Second paragraph about company..." className={textareaClass} />
            {errAbout.aboutText2 && <p className={errorClass}>{errAbout.aboutText2.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className={labelClass + " mb-0"}>About Section Image *</Label>
              <Button type="button" onClick={() => setMediaTarget({ type: 'about' })} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs h-7 px-2 flex items-center gap-1">
                <Images className="w-3.5 h-3.5" /> Choose
              </Button>
            </div>
            <Input {...regAbout('aboutImage')} placeholder="https://..." className={inputClass} />
            {errAbout.aboutImage && <p className={errorClass}>{errAbout.aboutImage.message}</p>}
            {watchedAbout.aboutImage && (
              <div className="mt-2 h-36 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <img src={watchedAbout.aboutImage} alt="About preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </CMSSection>

      {/* ── SECTION 3: Contact ───────────────────────────────────────────────── */}
      <CMSSection
        id="contact"
        title="Contact Details"
        icon={<Phone className="w-4 h-4" />}
        isDirty={dirtyContact}
        isSaving={saving.contact}
        onSave={onSaveContact}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className={labelClass}>Phone Number *</Label>
            <Input {...regContact('phone')} placeholder="+91 98765 43210" className={inputClass} />
            {errContact.phone && <p className={errorClass}>{errContact.phone.message}</p>}
          </div>
          <div>
            <Label className={labelClass}>Email Address *</Label>
            <Input {...regContact('email')} type="email" placeholder="info@nestora.in" className={inputClass} />
            {errContact.email && <p className={errorClass}>{errContact.email.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Label className={labelClass}>Office Address *</Label>
            <textarea {...regContact('address')} rows={2} placeholder="123, Main St, Hubli..." className={textareaClass} />
            {errContact.address && <p className={errorClass}>{errContact.address.message}</p>}
          </div>
        </div>
      </CMSSection>

      {/* ── SECTION 4: Brand Assets ──────────────────────────────────────────── */}
      <CMSSection
        id="brand"
        title="Brand Assets & Company Identity"
        icon={<Building2 className="w-4 h-4" />}
        isDirty={dirtyBrand}
        isSaving={saving.brand}
        onSave={onSaveBrand}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className={labelClass}>Company / Brand Name *</Label>
            <Input {...regBrand('companyName')} placeholder="NestoraHub" className={inputClass} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className={labelClass + " mb-0"}>Logo Image URL</Label>
              <Button type="button" onClick={() => setMediaTarget({ type: 'brand' })} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs h-7 px-2 flex items-center gap-1">
                <Image className="w-3.5 h-3.5" /> Choose
              </Button>
            </div>
            <Input {...regBrand('logoUrl')} placeholder="https://logo-url..." className={inputClass} />
          </div>
        </div>
        {watchedBrand.logoUrl && (
          <div className="mt-2">
            <Label className={labelClass}>Logo Preview</Label>
            <div className="w-32 h-16 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
              <img src={watchedBrand.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        )}
      </CMSSection>

      {/* ── SECTION 5: Footer & Social Media ────────────────────────────────── */}
      <CMSSection
        id="footer"
        title="Footer, Social Media & WhatsApp"
        icon={<Link2 className="w-4 h-4" />}
        isDirty={dirtyFooter}
        isSaving={saving.footer}
        onSave={onSaveFooter}
      >
        <div className="space-y-4">
          <div>
            <Label className={labelClass}>Footer Tagline *</Label>
            <textarea {...regFooter('footerTagline')} rows={3} placeholder="Company footer tagline..." className={textareaClass} />
            {errFooter.footerTagline && <p className={errorClass}>{errFooter.footerTagline.message}</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className={labelClass}>WhatsApp Number *</Label>
              <Input {...regFooter('whatsapp')} placeholder="+91 98765 43210" className={inputClass} />
              {errFooter.whatsapp && <p className={errorClass}>{errFooter.whatsapp.message}</p>}
            </div>
            <div>
              <Label className={labelClass}>WhatsApp Community URL</Label>
              <Input {...regFooter('whatsappCommunityUrl')} placeholder="https://chat.whatsapp.com/..." className={inputClass} />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <Label className={labelClass + " mb-3"}>Social Media Links</Label>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-800 rounded-lg px-3 h-10">
                <Facebook className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <input
                  {...regFooter('socialLinks.facebook')}
                  placeholder="https://facebook.com/nestora"
                  className="bg-transparent text-white placeholder:text-slate-600 text-xs outline-none flex-1"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-800 rounded-lg px-3 h-10">
                <Instagram className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <input
                  {...regFooter('socialLinks.instagram')}
                  placeholder="https://instagram.com/nestora"
                  className="bg-transparent text-white placeholder:text-slate-600 text-xs outline-none flex-1"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-800 rounded-lg px-3 h-10">
                <Linkedin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <input
                  {...regFooter('socialLinks.linkedin')}
                  placeholder="https://linkedin.com/company/nestora"
                  className="bg-transparent text-white placeholder:text-slate-600 text-xs outline-none flex-1"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-800 rounded-lg px-3 h-10">
                <Twitter className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <input
                  {...regFooter('socialLinks.twitter')}
                  placeholder="https://twitter.com/nestora"
                  className="bg-transparent text-white placeholder:text-slate-600 text-xs outline-none flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </CMSSection>

      {/* ── Shared Media Library Modal ──────────────────────────────────────── */}
      <MediaLibraryModal
        isOpen={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onSelect={handleSelectMedia}
        title="Select Media Asset"
      />
    </div>
  );
};

export default AdminCMS;
