import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { propertyRepository } from '@/admin/repositories/propertyRepository';
import { employeeRepository } from '@/admin/repositories/employeeRepository';
import type { AdminProperty, PropertyCategory, PropertyType, PropertyStatus, Employee } from '@/admin/types/admin';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  ArrowLeft,
  Loader2,
  ImageOff,
  Images,
  Sparkles,
  MapPin,
  Settings,
  Info,
  Search,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
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
import { resolveImageUrl } from '@/lib/image';

const propertySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  price: z.string().min(1, 'Price is required'),
  address: z.string().min(3, 'Address is required'),
  beds: z.coerce.number().min(0, 'Beds must be 0 or more'),
  baths: z.coerce.number().min(0, 'Baths must be 0 or more'),
  sqft: z.coerce.number().min(1, 'Area must be greater than 0'),
  type: z.enum(['For Sale', 'For Rent']),
  category: z.enum(['Residential', 'Commercial', 'Plots & Land']),
  status: z.enum(['draft', 'published', 'under_negotiation', 'sold', 'rented', 'archived']),
  featured: z.boolean(),
  isNew: z.boolean(),
  image: z.string().min(1, 'Image URL is required'),
  assignedAdmin: z.string().optional(),
  amenitiesStr: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

type TabId = 'basic' | 'location' | 'details' | 'images' | 'amenities' | 'seo' | 'preview';

const AdminPropertyForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      price: '',
      address: '',
      beds: 0,
      baths: 0,
      sqft: 0,
      type: 'For Sale',
      category: 'Residential',
      status: 'draft',
      featured: false,
      isNew: false,
      image: '',
      assignedAdmin: 'Super Admin',
      amenitiesStr: 'Water Supply, Car Parking, Electricity Backup',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: ''
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    employeeRepository.getAll().then(setEmployees);
  }, []);

  // Load existing property data
  useEffect(() => {
    if (!isEdit || !id) return;
    propertyRepository.getById(id).then((prop) => {
      if (!prop) {
        toast({ title: 'Property not found', variant: 'destructive' });
        navigate('/admin/properties');
        return;
      }
      reset({
        title: prop.title,
        price: prop.price,
        address: prop.address,
        beds: prop.beds,
        baths: prop.baths,
        sqft: prop.sqft,
        type: prop.type,
        category: prop.category,
        status: prop.status,
        featured: prop.featured,
        isNew: prop.isNew,
        image: prop.image,
        assignedAdmin: prop.assignedAdmin || 'Super Admin',
        amenitiesStr: prop.amenities?.join(', ') || '',
        seoTitle: prop.seoTitle || '',
        seoDescription: prop.seoDescription || '',
        seoKeywords: prop.seoKeywords || ''
      });
      setLoading(false);
    });
  }, [id, isEdit, reset, navigate, toast]);

  const onSubmit = async (values: PropertyFormValues) => {
    setSaving(true);
    try {
      const amenities = values.amenitiesStr 
        ? values.amenitiesStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: values.title,
        price: values.price,
        address: values.address,
        beds: values.beds,
        baths: values.baths,
        sqft: values.sqft,
        type: values.type as PropertyType,
        category: values.category as PropertyCategory,
        status: values.status as PropertyStatus,
        featured: values.featured,
        isNew: values.isNew,
        image: values.image,
        assignedAdmin: values.assignedAdmin || 'Super Admin',
        amenities,
        seoTitle: values.seoTitle || `${values.title} for sale`,
        seoDescription: values.seoDescription || `Get details on this luxury property located at ${values.address}`,
        seoKeywords: values.seoKeywords || 'real estate, Hubli'
      };

      if (isEdit && id) {
        await propertyRepository.update(id, payload, adminUser?.name || 'Admin');
        toast({ title: 'Property unit updated successfully.' });
      } else {
        await propertyRepository.create(payload, adminUser?.name || 'Admin');
        toast({ title: 'Property unit created successfully.' });
      }
      navigate('/admin/properties');
    } catch (err: any) {
      toast({ title: 'Saving failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'basic', label: 'Basic Info', icon: <Info className="w-3.5 h-3.5" /> },
    { id: 'location', label: 'Location', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'details', label: 'Details', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'images', label: 'Images', icon: <Images className="w-3.5 h-3.5" /> },
    { id: 'amenities', label: 'Amenities', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'seo', label: 'SEO', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'preview', label: 'Preview', icon: <Search className="w-3.5 h-3.5" /> }
  ];

  const currentStepIndex = tabs.findIndex(t => t.id === activeTab);

  const handleNext = async () => {
    let isValid = true;
    if (activeTab === 'basic') {
      isValid = await trigger(['title', 'price']);
    } else if (activeTab === 'location') {
      isValid = await trigger(['address']);
    } else if (activeTab === 'details') {
      isValid = await trigger(['sqft']);
    } else if (activeTab === 'images') {
      isValid = await trigger(['image']);
    }

    if (isValid && currentStepIndex < tabs.length - 1) {
      setActiveTab(tabs[currentStepIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setActiveTab(tabs[currentStepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderTabNavigation = () => (
    <div className="flex items-center justify-between pt-5 border-t border-slate-800 mt-6">
      <Button
        type="button"
        variant="outline"
        disabled={currentStepIndex === 0}
        onClick={handlePrev}
        className="border-slate-700 bg-slate-850 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold px-4"
      >
        <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous Step
      </Button>

      <span className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase hidden sm:inline">
        Step {currentStepIndex + 1} of {tabs.length} &bull; {tabs[currentStepIndex].label}
      </span>

      {currentStepIndex < tabs.length - 1 ? (
        <Button
          type="button"
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 flex items-center gap-1.5 shadow-md"
        >
          Next: {tabs[currentStepIndex + 1].label} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 flex items-center gap-1.5 shadow-md"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEdit ? 'Update Listing' : 'Create Property'}
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Retrieving property details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/properties')}
          className="text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg w-9 h-9"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white font-display">
            {isEdit ? `Edit Property Listing` : 'Create Property listing'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Define unit attributes, gallery assets and workflow settings.</p>
        </div>
      </div>

      {/* Tabs list navigation with step badges */}
      <div className="flex border border-slate-800 bg-slate-900/80 p-1.5 rounded-xl overflow-x-auto gap-1 text-slate-400">
        {tabs.map((tab, idx) => {
          const isCurrent = activeTab === tab.id;
          const isPassed = idx < currentStepIndex;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                isCurrent 
                  ? "bg-blue-600 text-white font-bold shadow-md" 
                  : isPassed
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                isCurrent
                  ? "bg-white text-blue-600"
                  : isPassed
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-800 text-slate-500"
              )}>
                {isPassed ? <Check className="w-2.5 h-2.5" /> : idx + 1}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* TAB 1: BASIC INFO */}
        {activeTab === 'basic' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Basic Parameters</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Property Title *</Label>
                <Input
                  {...register('title')}
                  placeholder="e.g. Modern Minimalist Villa"
                  className="bg-slate-850 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                />
                {errors.title && <p className="text-red-400 text-[10px] mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Price *</Label>
                <Input
                  {...register('price')}
                  placeholder="e.g. ₹1.25 Cr or ₹55,000/mo"
                  className="bg-slate-850 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                />
                {errors.price && <p className="text-red-400 text-[10px] mt-1">{errors.price.message}</p>}
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Listing Purpose</Label>
                <Select
                  value={watchedValues.type}
                  onValueChange={(v) => setValue('type', v as PropertyType)}
                >
                  <SelectTrigger className="bg-slate-850 border-slate-700 text-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-850 border-slate-700">
                    <SelectItem value="For Sale" className="text-white focus:bg-slate-800">For Sale</SelectItem>
                    <SelectItem value="For Rent" className="text-white focus:bg-slate-800">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Category Type</Label>
                <Select
                  value={watchedValues.category}
                  onValueChange={(v) => setValue('category', v as PropertyCategory)}
                >
                  <SelectTrigger className="bg-slate-850 border-slate-700 text-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-850 border-slate-700">
                    <SelectItem value="Residential" className="text-white focus:bg-slate-800">Residential</SelectItem>
                    <SelectItem value="Commercial" className="text-white focus:bg-slate-800">Commercial</SelectItem>
                    <SelectItem value="Plots & Land" className="text-white focus:bg-slate-800">Plots & Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Workflow Lifecycle Status</Label>
                <Select
                  value={watchedValues.status}
                  onValueChange={(v) => setValue('status', v as PropertyStatus)}
                >
                  <SelectTrigger className="bg-slate-850 border-slate-700 text-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-850 border-slate-700">
                    <SelectItem value="draft" className="text-white focus:bg-slate-800">Draft</SelectItem>
                    <SelectItem value="published" className="text-white focus:bg-slate-800">Published</SelectItem>
                    <SelectItem value="under_negotiation" className="text-white focus:bg-slate-800">Under Negotiation</SelectItem>
                    <SelectItem value="sold" className="text-white focus:bg-slate-800">Sold</SelectItem>
                    <SelectItem value="rented" className="text-white focus:bg-slate-800">Rented</SelectItem>
                    <SelectItem value="archived" className="text-white focus:bg-slate-800">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Assigned Admin</Label>
                <Select
                  value={watchedValues.assignedAdmin}
                  onValueChange={(v) => setValue('assignedAdmin', v)}
                >
                  <SelectTrigger className="bg-slate-850 border-slate-700 text-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-850 border-slate-700">
                    <SelectItem value="Super Admin" className="text-white focus:bg-slate-800">Super Admin</SelectItem>
                    {employees.filter(e => e.role === 'Admin').map(e => (
                      <SelectItem key={e.id} value={e.name} className="text-white focus:bg-slate-800">{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-2 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('featured')}
                    className="w-4 h-4 border-slate-700 rounded text-blue-600 bg-slate-800 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Mark unit as Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('isNew')}
                    className="w-4 h-4 border-slate-700 rounded text-blue-600 bg-slate-800 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Mark listing as New</span>
                </label>
              </div>
            </div>

            {renderTabNavigation()}
          </div>
        )}

        {/* TAB 2: LOCATION */}
        {activeTab === 'location' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Location Parameters</h3>
            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Full Address *</Label>
              <Input
                {...register('address')}
                placeholder="e.g. Vidyanagar, Hubli"
                className="bg-slate-850 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
              />
              {errors.address && <p className="text-red-400 text-[10px] mt-1">{errors.address.message}</p>}
              <span className="text-[10px] text-slate-500 block mt-1">Specify locality coordinates for maps search filtering.</span>
            </div>

            {renderTabNavigation()}
          </div>
        )}

        {/* TAB 3: DETAILS */}
        {activeTab === 'details' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Physical Specifications & Amenities</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Bedrooms</Label>
                <Input
                  type="number"
                  {...register('beds')}
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Bathrooms</Label>
                <Input
                  type="number"
                  step={0.5}
                  {...register('baths')}
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Area Size (sqft) *</Label>
                <Input
                  type="number"
                  {...register('sqft')}
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
                {errors.sqft && <p className="text-red-400 text-[10px] mt-1">{errors.sqft.message}</p>}
              </div>
            </div>

            {renderTabNavigation()}
          </div>
        )}

        {/* TAB: AMENITIES */}
        {activeTab === 'amenities' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Property Amenities</h3>
            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Amenities (Comma separated)</Label>
              <Input
                {...register('amenitiesStr')}
                placeholder="Water Supply, Car Parking, Security, Elevator, Power Backup"
                className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Enter amenities as comma-separated values to display on details pages.
              </span>
            </div>

            {renderTabNavigation()}
          </div>
        )}

        {/* TAB 4: IMAGES */}
        {activeTab === 'images' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">Property Media Selection</h3>
                <p className="text-slate-500 text-xs mt-0.5">Choose from uploaded photos or add external URLs.</p>
              </div>
              <Button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
              >
                <Images className="w-3.5 h-3.5" /> Choose from Media Library
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Cover Image URL *</Label>
              <Input
                {...register('image')}
                placeholder="https://images.unsplash.com/... or /uploads/..."
                className="bg-slate-850 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
              />
              {errors.image && <p className="text-red-400 text-[10px] mt-1">{errors.image.message}</p>}
            </div>

            {watchedValues.image ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Image Preview</span>
                  <button
                    type="button"
                    onClick={() => setMediaOpen(true)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium hover:underline"
                  >
                    Change Image
                  </button>
                </div>
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                  <img
                    src={resolveImageUrl(watchedValues.image)}
                    alt="Property selection"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                onClick={() => setMediaOpen(true)}
                className="w-full h-56 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl flex items-center justify-center text-slate-500 text-xs bg-slate-950/40 cursor-pointer transition-colors"
              >
                <div className="text-center">
                  <Images className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No image selected yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">Click here to choose from Media Library or upload a photo</p>
                </div>
              </div>
            )}

            {renderTabNavigation()}
          </div>
        )}

        {/* TAB 5: SEO METADATA */}
        {activeTab === 'seo' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Search Engine Optimization</h3>
            
            <div className="space-y-3">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">SEO Meta Title</Label>
                <Input
                  {...register('seoTitle')}
                  placeholder="e.g. Modern Villa in Vidyanagar, Hubli | Nestora"
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">SEO Description</Label>
                <Input
                  {...register('seoDescription')}
                  placeholder="e.g. Buy a premium minimalist 4BHK Villa..."
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">SEO Keywords</Label>
                <Input
                  {...register('seoKeywords')}
                  placeholder="e.g. villa hubli, property for sale vidyanagar"
                  className="bg-slate-850 border-slate-700 text-white focus:border-blue-500"
                />
              </div>
            </div>

            {renderTabNavigation()}
          </div>
        )}

        {/* TAB 6: PREVIEW CARD */}
        {activeTab === 'preview' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col items-center justify-center">
            <h3 className="text-white font-bold text-sm self-start">Mock Card Preview</h3>
            
            <div className="bg-white text-slate-800 rounded-xl overflow-hidden shadow-xl border border-gray-100 w-full max-w-[340px] transition-shadow">
              <div className="h-48 overflow-hidden relative bg-slate-100">
                {watchedValues.image ? (
                  <img src={resolveImageUrl(watchedValues.image)} alt={watchedValues.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image Specified
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge className="bg-blue-600 text-white text-[10px] uppercase font-bold border-none">
                    {watchedValues.type}
                  </Badge>
                  <Badge className="bg-slate-900 text-white text-[10px] uppercase font-bold border-none">
                    {watchedValues.category}
                  </Badge>
                </div>
                <button type="button" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-gray-400 flex items-center justify-center shadow-xs">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{watchedValues.title || 'Untitled Property'}</h4>
                <div className="flex items-center text-gray-400 text-[10px] mt-1 gap-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{watchedValues.address || 'Address not specified'}</span>
                </div>
                <div className="text-blue-600 font-bold text-base mt-2">{watchedValues.price || '₹ Price on request'}</div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-gray-50 flex justify-between text-[10px] text-gray-400 font-medium">
                <span>{watchedValues.beds} Bed{watchedValues.beds !== 1 ? 's' : ''}</span>
                <span>{watchedValues.baths} Bath{watchedValues.baths !== 1 ? 's' : ''}</span>
                <span>{watchedValues.sqft} SQFT</span>
              </div>
            </div>

            <div className="w-full">
              {renderTabNavigation()}
            </div>
          </div>
        )}

        {/* BUTTON ACTIONS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 bg-slate-900/60 p-4 rounded-xl">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/properties')}
            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
          >
            Cancel & Exit
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className="border-slate-700 bg-slate-850 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold px-4"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>

            {currentStepIndex < tabs.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5"
              >
                Next Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : null}

            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-7 text-xs font-semibold shadow-md"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEdit ? 'Update Details' : 'Create Property'}
            </Button>
          </div>
        </div>
      </form>

      {/* Shared Media library */}
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          const resolved = resolveImageUrl(url);
          setValue('image', resolved, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        }}
        title="Select Property Image"
      />
    </div>
  );
};

export default AdminPropertyForm;
