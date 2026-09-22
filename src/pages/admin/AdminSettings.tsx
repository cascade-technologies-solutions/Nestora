import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { SiteSettings } from '@/admin/types/admin';
import { Loader2, Save, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  logoUrl: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
  whatsappCommunityUrl: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }),
  footerTagline: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    settingsRepository.get().then((data) => {
      reset({
        companyName: data.companyName,
        logoUrl: data.logoUrl,
        phone: data.phone,
        email: data.email,
        address: data.address,
        whatsapp: data.whatsapp,
        whatsappCommunityUrl: data.whatsappCommunityUrl,
        socialLinks: data.socialLinks,
        footerTagline: data.footerTagline,
      });
      setLastUpdated(data.updatedAt);
      setIsLoading(false);
    });
  }, [reset]);

  const handleReset = () => {
    const defaults = settingsRepository.getDefault();
    reset({
      companyName: defaults.companyName,
      logoUrl: defaults.logoUrl,
      phone: defaults.phone,
      email: defaults.email,
      address: defaults.address,
      whatsapp: defaults.whatsapp,
      whatsappCommunityUrl: defaults.whatsappCommunityUrl,
      socialLinks: defaults.socialLinks,
      footerTagline: defaults.footerTagline,
    });
    toast({ title: 'Reset to defaults', description: 'Save to apply.' });
  };

  const onSubmit = async (values: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const payload: Omit<SiteSettings, 'updatedAt'> = {
        companyName: values.companyName,
        logoUrl: values.logoUrl ?? '',
        phone: values.phone ?? '',
        email: values.email ?? '',
        address: values.address ?? '',
        whatsapp: values.whatsapp ?? '',
        whatsappCommunityUrl: values.whatsappCommunityUrl ?? '',
        socialLinks: {
          facebook: values.socialLinks.facebook ?? '',
          instagram: values.socialLinks.instagram ?? '',
          linkedin: values.socialLinks.linkedin ?? '',
          twitter: values.socialLinks.twitter ?? '',
        },
        footerTagline: values.footerTagline ?? '',
      };
      const saved = await settingsRepository.save(payload);
      setLastUpdated(saved.updatedAt);
      reset(values);
      toast({
        title: 'Settings saved',
        description: 'Header, footer and contact info updated.',
      });
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Website Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure company information displayed on the public website.
            {lastUpdated && (
              <span className="ml-1 text-slate-500">
                · Last saved {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview Site
          </Button>
        </a>
      </div>

      {/* Info banner */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl px-4 py-3 text-blue-300 text-sm">
        Changes are <strong>immediately reflected</strong> in the header, footer and contact sections — no rebuild required.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Company Information</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">Company Name *</Label>
              <Input
                {...register('companyName')}
                placeholder="NestoraHub"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
              {errors.companyName && (
                <p className="text-red-400 text-xs mt-1">{errors.companyName.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">Logo URL</Label>
              <Input
                {...register('logoUrl')}
                placeholder="https://… (leave blank to use text logo)"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Phone</Label>
              <Input
                {...register('phone')}
                placeholder="+91 99026 76457"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Email</Label>
              <Input
                {...register('email')}
                type="email"
                placeholder="info@nestora.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">Address</Label>
              <Input
                {...register('address')}
                placeholder="Nestora Ave, Sri Sai Properties, Vidya Nagar, Hubli 580001"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">WhatsApp</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">WhatsApp Phone</Label>
              <Input
                {...register('whatsapp')}
                placeholder="+919902676457"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
              <p className="text-slate-500 text-xs mt-1">
                Include country code. Activates WhatsApp buttons on the website.
              </p>
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Community URL</Label>
              <Input
                {...register('whatsappCommunityUrl')}
                placeholder="https://chat.whatsapp.com/..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Social Links</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {(
              [
                { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/nestora' },
                { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/nestora' },
                { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/nestora' },
                { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/nestora' },
              ] as const
            ).map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-slate-300 text-sm mb-1.5 block">{label}</Label>
                <Input
                  {...register(`socialLinks.${key}`)}
                  placeholder={placeholder}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Footer</h2>
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">Footer Tagline</Label>
            <textarea
              {...register('footerTagline')}
              rows={2}
              placeholder="From renovation and waterproofing to construction…"
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none rounded-md px-3 py-2 text-sm resize-none transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end flex-wrap">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Defaults
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-8 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
