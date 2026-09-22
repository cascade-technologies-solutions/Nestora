import { useEffect, useState, useCallback } from 'react';
import { servicesRepository } from '@/admin/repositories/servicesRepository';
import type { AdminService } from '@/admin/types/admin';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Plus,
  Trash2,
  Loader2,
  Wrench,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Pencil,
  Sparkles,
  Images,
  Info,
  ShieldCheck,
  Building,
  Hammer,
  Truck,
  Home,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Lucide Icon mapping for services
const iconMap: Record<string, React.ComponentType<any>> = {
  Building,
  Wrench,
  ShieldCheck,
  Hammer,
  Truck,
  Home,
  FileText
};

const colors = [
  'bg-blue-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-slate-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-violet-600'
];

const AdminServices = () => {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Building');
  const [color, setColor] = useState('bg-blue-600');
  const [enabled, setEnabled] = useState(true);
  const [image, setImage] = useState('');
  const [workTypesStr, setWorkTypesStr] = useState('');
  const [formError, setFormError] = useState('');

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const loadServices = useCallback(async () => {
    const list = await servicesRepository.getAll();
    setServices(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setTitle('');
    setDescription('');
    setIcon('Building');
    setColor('bg-blue-600');
    setEnabled(true);
    setImage('');
    setWorkTypesStr('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: AdminService) => {
    setEditingService(service);
    setTitle(service.title);
    setDescription(service.description);
    setIcon(service.icon);
    setColor(service.color);
    setEnabled(service.enabled);
    setImage(service.image || '');
    setWorkTypesStr(service.workTypes.join(', '));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    const workTypes = workTypesStr
      ? workTypesStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      title: title.trim(),
      description: description.trim(),
      icon,
      color,
      enabled,
      image: image.trim() || undefined,
      workTypes
    };

    try {
      if (editingService) {
        await servicesRepository.update(editingService.id, payload, adminUser?.name || 'Admin');
        toast({ title: 'Service updated', description: `Successfully updated ${title}.` });
      } else {
        await servicesRepository.create(payload, adminUser?.name || 'Admin');
        toast({ title: 'Service created', description: `Successfully created ${title}.` });
      }
      setIsModalOpen(false);
      loadServices();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save service.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete service "${name}"?`)) return;

    await servicesRepository.delete(id, adminUser?.name || 'Admin');
    toast({
      title: 'Service deleted',
      description: `Removed "${name}" from the repository.`
    });
    loadServices();
  };

  const handleToggleEnable = async (service: AdminService) => {
    const updated = await servicesRepository.update(service.id, { enabled: !service.enabled }, adminUser?.name || 'Admin');
    toast({
      title: updated.enabled ? 'Service Enabled' : 'Service Disabled',
      description: `"${service.title}" visibility toggled.`
    });
    loadServices();
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= services.length) return;

    const orderedIds = [...services].map(s => s.id);
    // Swap IDs
    const temp = orderedIds[index];
    orderedIds[index] = orderedIds[nextIndex];
    orderedIds[nextIndex] = temp;

    await servicesRepository.reorder(orderedIds, adminUser?.name || 'Admin');
    loadServices();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading services directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Services Directory</h1>
          <p className="text-slate-500 text-xs mt-1">
            Displaying {services.filter(s => s.enabled).length} of {services.length} active service divisions.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      {/* Services List / Reordering Cards */}
      <div className="grid gap-4 max-w-3xl">
        {services.map((service, index) => {
          const Icon = iconMap[service.icon] || Wrench;
          return (
            <Card
              key={service.id}
              className={cn(
                "bg-slate-900 border-slate-800 hover:border-slate-750 transition-all text-white",
                !service.enabled && "opacity-60"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  {/* Reordering Controls */}
                  <div className="flex flex-col gap-1 pr-2 border-r border-slate-850">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="text-slate-500 hover:text-white disabled:text-slate-800 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === services.length - 1}
                      className="text-slate-500 hover:text-white disabled:text-slate-800 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon & Details */}
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", service.color)}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      {service.title}
                      {!service.enabled && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-red-900/40 text-red-400 border border-red-900 px-1 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md line-clamp-1 mt-0.5">{service.description}</p>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleEnable(service)}
                    className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    title={service.enabled ? "Disable Service" : "Enable Service"}
                  >
                    {service.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-400" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(service)}
                    className="w-8 h-8 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                    title="Edit Service"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(service.id, service.title)}
                    className="w-8 h-8 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display text-white">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 text-slate-300">
            {/* Title */}
            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Service Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chemical Waterproofing"
                className="bg-slate-850 border-slate-700 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Short Description *</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Description of this service division..."
                className="w-full bg-slate-850 border border-slate-700 rounded-md p-3 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Lucide Icon</Label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="bg-slate-850 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
                >
                  <option value="Building">Building</option>
                  <option value="Wrench">Wrench</option>
                  <option value="ShieldCheck">ShieldCheck</option>
                  <option value="Hammer">Hammer</option>
                  <option value="Truck">Truck</option>
                  <option value="Home">Home</option>
                  <option value="FileText">FileText</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Color theme</Label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="bg-slate-850 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
                >
                  <option value="bg-blue-600">Blue Theme</option>
                  <option value="bg-amber-600">Amber Theme</option>
                  <option value="bg-cyan-600">Cyan Theme</option>
                  <option value="bg-slate-600">Slate Theme</option>
                  <option value="bg-emerald-600">Emerald Theme</option>
                  <option value="bg-indigo-600">Indigo Theme</option>
                  <option value="bg-violet-600">Violet Theme</option>
                </select>
              </div>
            </div>

            {/* Image & Gallery selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-slate-400 text-xs font-semibold">Service Image URL</Label>
                <Button type="button" size="xs" onClick={() => setMediaOpen(true)} className="bg-slate-800 border border-slate-700 text-white rounded text-xs py-1">
                  Media Library
                </Button>
              </div>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Image URL..."
                className="bg-slate-850 border-slate-700 text-white"
              />
            </div>

            {/* Work Types */}
            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1.5 block">Sub Work Types (Comma separated)</Label>
              <Input
                value={workTypesStr}
                onChange={(e) => setWorkTypesStr(e.target.value)}
                placeholder="Residential, Commercial, Civil plans..."
                className="bg-slate-850 border-slate-700 text-white"
              />
            </div>

            {/* Enabled */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="service-enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 border-slate-700 rounded text-blue-600 bg-slate-800 cursor-pointer"
              />
              <Label htmlFor="service-enabled" className="text-xs text-slate-300 font-semibold cursor-pointer select-none">
                Enable Service immediately on website
              </Label>
            </div>

            {/* Errors */}
            {formError && <p className="text-red-400 text-xs mt-1">{formError}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-850"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Save Service
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shared Media library */}
      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => setImage(url)}
        title="Select Service Image"
      />
    </div>
  );
};

export default AdminServices;
