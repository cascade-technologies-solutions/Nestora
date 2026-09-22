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
import { ArrowLeft, Loader2, ImageOff, Images, Sparkles, MapPin, Settings, Info, Search, Heart } from 'lucide-react';
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
    { id: 'basic', label: 'Basic Information', icon: <Info className="w-4 h-4" /> },
    { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
    { id: 'details', label: 'Property Details', icon: <Settings className="w-4 h-4" /> },
    { id: 'images', label: 'Images', icon: <Images className="w-4 h-4" /> },
    { id: 'amenities', label: 'Amenities', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'seo', label: 'SEO', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'preview', label: 'Preview', icon: <Search className="w-4 h-4" /> }
  ];

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

      {/* Tabs list navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2 text-slate-400">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
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
          </div>
        )}

        {/* TAB 4: IMAGES */}
        {activeTab === 'images' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Media Selection</h3>
              <Button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 text-xs py-1"
              >
                <Images className="w-3.5 h-3.5" /> Choose from Media Library
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Image URL *</Label>
              <Input
                {...register('image')}
                placeholder="https://images.unsplash.com/..."
                className="bg-slate-850 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
              />
              {errors.image && <p className="text-red-400 text-[10px] mt-1">{errors.image.message}</p>}
            </div>

            {watchedValues.image ? (
              <div className="relative w-full h-56 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                <img src={watchedValues.image} alt="Property selection" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-56 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-xs bg-slate-950/40">
                <div className="text-center">
                  <ImageOff className="w-8 h-8 text-slate-700 mx-auto mb-1" />
                  No image selected yet. Click Media Library above.
                </div>
              </div>
            )}
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
          </div>
        )}

        {/* TAB 6: PREVIEW CARD */}
        {activeTab === 'preview' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col items-center justify-center">
            <h3 className="text-white font-bold text-sm self-start">Mock Card Preview</h3>
            
            <div className="bg-white text-slate-800 rounded-xl overflow-hidden shadow-xl border border-gray-100 w-full max-w-[340px] transition-shadow">
              <div className="h-48 overflow-hidden relative bg-slate-100">
                {watchedValues.image ? (
                  <img src={watchedValues.image} alt={watchedValues.title} className="w-full h-full object-cover" />
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
          </div>
        )}

        {/* BUTTON ACTIONS */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/properties')}
            className="text-slate-400 hover:text-white hover:bg-slate-900"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-8"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Update Details' : 'Create Property'}
          </Button>
        </div>
      </form>

      {/* Shared Media library */}
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => setValue('image', url, { shouldDirty: true })}
        title="Select Property Image"
      />
    </div>
  );
};

export default AdminPropertyForm;
