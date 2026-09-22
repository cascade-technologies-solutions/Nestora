import { useState, useEffect } from 'react';
import { mediaRepository } from '@/admin/repositories/mediaRepository';
import type { MediaAsset } from '@/admin/types/admin';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, Plus, Trash2, CheckCircle2, ImageOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export const MediaLibraryModal = ({ isOpen, onClose, onSelect, title = "Select Image" }: MediaLibraryModalProps) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filtered, setFiltered] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const loadAssets = async () => {
    const data = await mediaRepository.getAll();
    setAssets(data);
    setFiltered(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadAssets();
      setSelectedUrl(null);
      setExternalUrl('');
    }
  }, [isOpen]);

  // Search filter
  useEffect(() => {
    const term = search.toLowerCase().trim();
    if (!term) {
      setFiltered(assets);
    } else {
      setFiltered(assets.filter(a => a.name.toLowerCase().includes(term)));
    }
  }, [search, assets]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, WEBP).",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const newAsset = await mediaRepository.add(
          file.name,
          dataUrl,
          file.size,
          adminUser?.name || 'Admin'
        );
        toast({
          title: "Upload Successful",
          description: `Image "${file.name}" uploaded successfully.`
        });
        await loadAssets();
        setSelectedUrl(newAsset.url);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddExternal = async () => {
    if (!externalUrl.trim().startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid HTTP/HTTPS image URL.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const name = externalUrl.split('/').pop()?.split('?')[0] || `external_${Date.now()}.jpg`;
      const newAsset = await mediaRepository.add(
        name,
        externalUrl,
        0,
        adminUser?.name || 'Admin'
      );
      toast({
        title: "External URL added",
        description: `External image added to library.`
      });
      await loadAssets();
      setSelectedUrl(newAsset.url);
      setExternalUrl('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, assetId: string, assetName: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${assetName}"?`)) return;

    await mediaRepository.delete(assetId, adminUser?.name || 'Admin');
    toast({
      title: "Deleted successfully",
      description: `Image "${assetName}" removed from library.`
    });
    if (selectedUrl === assets.find(a => a.id === assetId)?.url) {
      setSelectedUrl(null);
    }
    await loadAssets();
  };

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-display text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-2">
          {/* Side pane: upload & external url */}
          <div className="space-y-4 border-r border-slate-800 pr-0 md:pr-6">
            <h3 className="text-sm font-semibold text-slate-300">Add New Media</h3>
            
            {/* Upload */}
            <div>
              <input
                type="file"
                id="modal-media-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 py-5"
                onClick={() => document.getElementById('modal-media-upload')?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Image
              </Button>
            </div>

            <div className="flex items-center text-slate-500 my-2">
              <span className="w-full border-t border-slate-800"></span>
              <span className="mx-2 text-xs uppercase font-semibold">or</span>
              <span className="w-full border-t border-slate-800"></span>
            </div>

            {/* External URL */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400">External Image URL</label>
              <div className="flex gap-2">
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="bg-slate-800 border-slate-700 text-white text-xs placeholder:text-slate-500"
                />
                <Button
                  onClick={handleAddExternal}
                  disabled={isUploading || !externalUrl}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {selectedUrl && (
              <div className="border border-slate-850 bg-slate-850 p-3 rounded-lg space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Selected Preview</h4>
                <div className="relative h-28 w-full bg-slate-900 rounded-md overflow-hidden">
                  <img src={selectedUrl} alt="Selected preview" className="w-full h-full object-cover" />
                </div>
                <Button
                  onClick={handleSelect}
                  className="w-full bg-green-600 hover:bg-green-500 text-white rounded-lg py-4 text-sm font-semibold"
                >
                  Apply Selection
                </Button>
              </div>
            )}
          </div>

          {/* Grid pane: list media */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search images by filename..."
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            {/* Images Grid */}
            <div className="flex-1 max-h-[350px] overflow-y-auto pr-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                  <ImageOff className="w-10 h-10 text-slate-700 mb-2" />
                  <p className="text-sm">No media files found.</p>
                  <p className="text-xs text-slate-600">Upload an image or check your spelling.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filtered.map((asset) => {
                    const isSelected = selectedUrl === asset.url;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedUrl(asset.url)}
                        className={cn(
                          "relative group aspect-square rounded-lg overflow-hidden border bg-slate-950 cursor-pointer transition-all",
                          isSelected ? "border-blue-500 ring-2 ring-blue-500/20 scale-[0.98]" : "border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                        
                        {/* Selector overlays */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white rounded-full p-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-slate-300 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {asset.name}
                        </div>

                        {/* Trash */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, asset.id, asset.name)}
                          className="absolute top-1.5 left-1.5 bg-red-600/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          title="Delete image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSelect}
                disabled={!selectedUrl}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Choose Image
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
