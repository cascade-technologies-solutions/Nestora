import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { SiteSettings } from '@/admin/types/admin';
import { Loader2, Save, RefreshCw, ExternalLink, Database, Download, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';

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

  const [isExporting, setIsExporting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  // 1. Export database to JSON
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/admin/migrate/export');
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nestora_database_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export Completed",
        description: "Entire PostgreSQL database exported to JSON file.",
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export database.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Migrate browser localStorage to Database
  const handleMigrateLocalStorage = async () => {
    setIsMigrating(true);
    setMigrationStatus('Scanning browser localStorage...');
    try {
      const readKey = (key: string) => {
        try {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : null;
        } catch {
          return null;
        }
      };

      const payload = {
        properties: readKey('nestora_properties') || readKey('real_estate_properties'),
        projects: readKey('nestora_projects'),
        services: readKey('nestora_services'),
        enquiries: readKey('nestora_enquiries'),
        cms: readKey('nestora_homepage_cms'),
        settings: readKey('nestora_site_settings'),
      };

      const hasData = Object.values(payload).some(val => val !== null && val !== undefined && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0));

      if (!hasData) {
        toast({
          title: "No Local Data Found",
          description: "No legacy localStorage keys were found in this browser. Database is already running on PostgreSQL.",
        });
        setMigrationStatus(null);
        return;
      }

      setMigrationStatus('Uploading and upserting data to PostgreSQL...');
      const res = await api.post('/admin/migrate/import', payload);
      const summary = res.imported || res;
      setMigrationStatus('Migration successfully imported!');
      toast({
        title: "Migration Completed",
        description: `Imported ${summary.properties || 0} properties, ${summary.projects || 0} projects, ${summary.services || 0} services.`,
      });
    } catch (err: any) {
      toast({
        title: "Migration Failed",
        description: err.message || "Failed to import localStorage data.",
        variant: "destructive",
      });
      setMigrationStatus('Migration failed.');
    } finally {
      setIsMigrating(false);
    }
  };

  // 3. Import JSON Backup File
  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMigrating(true);
    setMigrationStatus(`Reading "${file.name}"...`);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const payload = parsed.payload || parsed.data?.payload || parsed;

      setMigrationStatus('Importing backup payload to PostgreSQL...');
      const res = await api.post('/admin/migrate/import', payload);
      const summary = res.imported || res;
      toast({
        title: "Backup Imported",
        description: `Successfully restored database records.`,
      });
      setMigrationStatus('Backup restore completed!');
    } catch (err: any) {
      toast({
        title: "Import Error",
        description: err.message || "Invalid JSON backup file.",
        variant: "destructive",
      });
      setMigrationStatus('Import failed.');
    } finally {
      setIsMigrating(false);
      e.target.value = '';
    }
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

      {/* Database Management & LocalStorage Migration (Checklist #23) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
            Database Migration & Disaster Recovery
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          PostgreSQL is now the single source of truth for all Nestora data. Use these tools to export full database snapshots, restore from a JSON backup file, or migrate any legacy browser-local demo data directly into PostgreSQL.
        </p>

        {migrationStatus && (
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-indigo-950/60 border border-indigo-700/40 text-indigo-200">
            {isMigrating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{migrationStatus}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {/* Export JSON */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleExportBackup}
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white gap-2"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-indigo-400" />}
            Export DB Backup (JSON)
          </Button>

          {/* Migrate LocalStorage */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isMigrating}
            onClick={handleMigrateLocalStorage}
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white gap-2"
          >
            {isMigrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-emerald-400" />}
            Migrate Browser LocalStorage to DB
          </Button>

          {/* Import JSON */}
          <label className="inline-flex">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportBackupFile}
              disabled={isMigrating}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isMigrating}
              onClick={(e) => {
                const input = (e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement);
                if (input) input.click();
              }}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white gap-2"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              Import Backup File (.json)
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
