import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { projectRepository } from '@/admin/repositories/projectRepository';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ArrowLeft, Loader2, ImageOff, Images, Plus, Trash2, Home, Sparkles, MapPin, Info, Search, Settings } from 'lucide-react';
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

const projectSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  category: z.enum(['Construction', 'Renovation', 'Waterproofing', 'Fabrication', 'Earthworks']),
  location: z.string().min(3, 'Location is required'),
  status: z.enum(['Completed', 'In Progress', 'Planning', 'Archived']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  image: z.string().min(1, 'Hero image URL is required'),
  beforeImage: z.string().optional(),
  afterImage: z.string().optional(),
  gallery: z.array(z.string().min(1, 'URL is required')).optional(),
  featured: z.boolean(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type TabId = 'general' | 'gallery' | 'beforeafter' | 'description' | 'status';

const AdminProjectForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{ type: 'hero' | 'before' | 'after' | 'gallery'; index?: number } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      category: 'Construction',
      location: '',
      status: 'Planning',
      description: '',
      image: '',
      beforeImage: '',
      afterImage: '',
      gallery: [],
      featured: false
    }
  });

  const { fields: galleryFields, append: appendGallery, remove: removeGallery } = useFieldArray({
    control,
    name: 'gallery'
  });

  const watchedValues = watch();

  useEffect(() => {
    if (!isEdit || !id) return;
    projectRepository.getById(id).then((proj) => {
      if (!proj) {
        toast({ title: 'Project not found', variant: 'destructive' });
        navigate('/admin/projects');
        return;
      }
      reset({
        title: proj.title,
        category: proj.category,
        location: proj.location,
        status: proj.status,
        description: proj.description,
        image: proj.image,
        beforeImage: proj.beforeImage || '',
        afterImage: proj.afterImage || '',
        gallery: proj.gallery || [],
        featured: proj.featured
      });
      setLoading(false);
    });
  }, [id, isEdit, reset, navigate, toast]);

  const onSubmit = async (values: ProjectFormValues) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        category: values.category,
        location: values.location,
        status: values.status,
        description: values.description,
        image: values.image,
        beforeImage: values.beforeImage || '',
        afterImage: values.afterImage || '',
        gallery: values.gallery || [],
        featured: values.featured
      };

      if (isEdit && id) {
        await projectRepository.update(id, payload, adminUser?.name || 'Admin');
        toast({ title: 'Project details updated successfully.' });
      } else {
        await projectRepository.create(payload, adminUser?.name || 'Admin');
        toast({ title: 'Project showcase created successfully.' });
      }
      navigate('/admin/projects');
    } catch (err: any) {
      toast({ title: 'Saving failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectMedia = (url: string) => {
    if (!mediaTarget) return;
    if (mediaTarget.type === 'hero') {
      setValue('image', url, { shouldDirty: true });
    } else if (mediaTarget.type === 'before') {
      setValue('beforeImage', url, { shouldDirty: true });
    } else if (mediaTarget.type === 'after') {
      setValue('afterImage', url, { shouldDirty: true });
    } else if (mediaTarget.type === 'gallery' && mediaTarget.index !== undefined) {
      setValue(`gallery.${mediaTarget.index}`, url, { shouldDirty: true });
    }
    setMediaTarget(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading project showcase data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/projects')}
          className="text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg w-9 h-9"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white font-display">
            {isEdit ? 'Edit Showcase Project' : 'Create Showcase Project'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage before/after captures, galleries and completion statuses.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2 text-slate-400">
        {[
          { id: 'general', label: 'General', icon: <Info className="w-4 h-4" /> },
          { id: 'gallery', label: 'Gallery', icon: <Plus className="w-4 h-4" /> },
          { id: 'beforeafter', label: 'Before / After', icon: <Images className="w-4 h-4" /> },
          { id: 'description', label: 'Description', icon: <Info className="w-4 h-4" /> },
          { id: 'status', label: 'Status', icon: <Settings className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabId)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 border-transparent transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 font-bold"
                : "hover:text-white hover:border-slate-800"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">General Parameters</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Project Title *</Label>
                <Input
                  {...register('title')}
                  placeholder="e.g. Vikas Nagar Makeover"
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
                {errors.title && <p className="text-red-400 text-[10px] mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Location *</Label>
                <Input
                  {...register('location')}
                  placeholder="e.g. Vidyanagar, Hubli"
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
                {errors.location && <p className="text-red-400 text-[10px] mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Category Division</Label>
                <Select
                  value={watchedValues.category}
                  onValueChange={(v) => setValue('category', v as any)}
                >
                  <SelectTrigger className="bg-slate-850 border-slate-700 text-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-850 border-slate-700">
                    <SelectItem value="Construction" className="text-white focus:bg-slate-800">Construction</SelectItem>
                    <SelectItem value="Renovation" className="text-white focus:bg-slate-800">Renovation</SelectItem>
                    <SelectItem value="Waterproofing" className="text-white focus:bg-slate-800">Waterproofing</SelectItem>
                    <SelectItem value="Fabrication" className="text-white focus:bg-slate-800">Fabrication</SelectItem>
                    <SelectItem value="Earthworks" className="text-white focus:bg-slate-800">Earthworks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400 text-xs font-semibold">Hero Showcase Image *</Label>
                  <Button type="button" size="xs" onClick={() => setMediaTarget({ type: 'hero' })} className="bg-blue-600 hover:bg-blue-500 text-white rounded text-xs py-1">
                    Select Hero Image
                  </Button>
                </div>
                <Input
                  {...register('image')}
                  placeholder="Hero image URL..."
                  className="bg-slate-850 border-slate-700 text-white"
                />
                {watchedValues.image && (
                  <div className="h-40 rounded-lg overflow-hidden border border-slate-850 bg-slate-950">
                    <img src={watchedValues.image} alt="Hero showcase preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="featured"
                  {...register('featured')}
                  className="w-4 h-4 border-slate-700 rounded text-blue-600 bg-slate-800 cursor-pointer"
                />
                <Label htmlFor="featured" className="text-xs text-slate-300 font-semibold cursor-pointer select-none">
                  Featured on Public Showcase
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Gallery Images</h3>
              <Button
                type="button"
                onClick={() => appendGallery('')}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 text-xs py-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Image Row
              </Button>
            </div>

            {galleryFields.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No gallery items added yet. Click above to add some.</p>
            ) : (
              <div className="space-y-4">
                {galleryFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-start bg-slate-950 p-3 rounded-lg border border-slate-850">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Item #{idx + 1}</span>
                        <Button type="button" size="xs" onClick={() => setMediaTarget({ type: 'gallery', index: idx })} className="bg-slate-800 text-white rounded text-xs py-0.5 px-2">
                          Select Image
                        </Button>
                      </div>
                      <Input
                        {...register(`gallery.${idx}`)}
                        placeholder="Image URL..."
                        className="bg-slate-850 border-slate-700 text-white text-xs h-8"
                      />
                      {watchedValues.gallery?.[idx] && (
                        <div className="h-24 w-36 rounded overflow-hidden border border-slate-800 bg-slate-900 mt-1">
                          <img src={watchedValues.gallery[idx]} alt="Gallery preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGallery(idx)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-950/20 w-8 h-8 rounded-lg mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BEFORE / AFTER TAB */}
        {activeTab === 'beforeafter' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <h3 className="text-white font-bold text-sm">Before & After Media Captures</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400 text-xs font-semibold">Before capture</Label>
                  <Button type="button" size="xs" onClick={() => setMediaTarget({ type: 'before' })} className="bg-slate-800 border border-slate-700 text-white rounded text-xs py-1">
                    Select Before
                  </Button>
                </div>
                <Input
                  {...register('beforeImage')}
                  placeholder="Before image URL..."
                  className="bg-slate-850 border-slate-700 text-white"
                />
                {watchedValues.beforeImage && (
                  <div className="h-32 rounded-lg overflow-hidden border border-slate-850 bg-slate-950">
                    <img src={watchedValues.beforeImage} alt="Before preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400 text-xs font-semibold">After capture</Label>
                  <Button type="button" size="xs" onClick={() => setMediaTarget({ type: 'after' })} className="bg-slate-800 border border-slate-700 text-white rounded text-xs py-1">
                    Select After
                  </Button>
                </div>
                <Input
                  {...register('afterImage')}
                  placeholder="After image URL..."
                  className="bg-slate-850 border-slate-700 text-white"
                />
                {watchedValues.afterImage && (
                  <div className="h-32 rounded-lg overflow-hidden border border-slate-850 bg-slate-950">
                    <img src={watchedValues.afterImage} alt="After preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DESCRIPTION TAB */}
        {activeTab === 'description' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Description & Technical Scopes</h3>
            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Detailed Project Description *</Label>
              <textarea
                {...register('description')}
                rows={8}
                placeholder="Write detailed milestones, work framing guidelines and engineering checklists here..."
                className="w-full bg-slate-855 border border-slate-700 rounded-md p-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              {errors.description && <p className="text-red-400 text-[10px] mt-1">{errors.description.message}</p>}
            </div>
          </div>
        )}

        {/* STATUS TAB */}
        {activeTab === 'status' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Workflow Status Selection</h3>
            <div className="max-w-md">
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Project Lifecycle Status</Label>
              <Select
                value={watchedValues.status}
                onValueChange={(v) => setValue('status', v as any)}
              >
                <SelectTrigger className="bg-slate-850 border-slate-700 text-white focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-850 border-slate-700">
                  <SelectItem value="Planning" className="text-white focus:bg-slate-800">Planning</SelectItem>
                  <SelectItem value="In Progress" className="text-white focus:bg-slate-800">In Progress</SelectItem>
                  <SelectItem value="Completed" className="text-white focus:bg-slate-800">Completed</SelectItem>
                  <SelectItem value="Archived" className="text-white focus:bg-slate-800">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* BUTTON ACTIONS */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/projects')}
            className="text-slate-400 hover:text-white hover:bg-slate-900"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-8"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Update Details' : 'Create Project'}
          </Button>
        </div>
      </form>

      {/* Shared Media library */}
      <MediaLibraryModal
        isOpen={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onSelect={handleSelectMedia}
        title="Select Project Image"
      />
    </div>
  );
};

export default AdminProjectForm;
