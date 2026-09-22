import { useEffect, useState, useCallback, useRef } from 'react';
import { mediaRepository } from '@/admin/repositories/mediaRepository';
import type { MediaAsset } from '@/admin/types/admin';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Upload,
  Search,
  Trash2,
  Copy,
  Plus,
  Loader2,
  ImageOff,
  ClipboardCheck,
  ExternalLink,
  LayoutGrid,
  List,
  Edit2,
  RefreshCw,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AdminMedia = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filtered, setFiltered] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // View states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'local' | 'external'>('all');
  
  // Selection mode
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const loadMedia = useCallback(async () => {
    const list = await mediaRepository.getAll();
    setAssets(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Filtering & Sorting logic
  useEffect(() => {
    let list = [...assets];

    // Search query
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(a => a.name.toLowerCase().includes(q));
    }

    // Filter by type
    if (filterType === 'local') {
      list = list.filter(a => a.url.startsWith('data:'));
    } else if (filterType === 'external') {
      list = list.filter(a => !a.url.startsWith('data:'));
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFiltered(list);
  }, [search, assets, sortBy, sortOrder, filterType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Unsupported format",
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
        await mediaRepository.add(
          file.name,
          dataUrl,
          file.size,
          adminUser?.name || 'Admin'
        );
        toast({
          title: "Image Uploaded",
          description: `"${file.name}" added to Media Library.`
        });
        loadMedia();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Failed to convert file data.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalUrl.trim().startsWith('http')) {
      toast({
        title: "Invalid Link",
        description: "Please input a valid HTTP/HTTPS address.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const filename = externalUrl.split('/').pop()?.split('?')[0] || `external_${Date.now()}.jpg`;
      await mediaRepository.add(
        filename,
        externalUrl,
        0,
        adminUser?.name || 'Admin'
      );
      toast({
        title: "External image linked",
        description: "Added external Unsplash resource to Media Library."
      });
      setExternalUrl('');
      loadMedia();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete image "${name}"?`)) return;
    await mediaRepository.delete(id, adminUser?.name || 'Admin');
    toast({
      title: "Image removed",
      description: "Asset deleted from shared media library."
    });
    setSelectedIds(prev => prev.filter(item => item !== id));
    loadMedia();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected images?`)) return;
    
    setLoading(true);
    for (const id of selectedIds) {
      await mediaRepository.delete(id, adminUser?.name || 'Admin');
    }
    toast({
      title: "Bulk Delete Successful",
      description: `Removed ${selectedIds.length} assets from shared Media Library.`
    });
    setSelectedIds([]);
    loadMedia();
  };

  const handleRename = async (id: string, currentName: string) => {
    const newName = prompt("Rename asset filename:", currentName);
    if (!newName || newName.trim() === currentName || newName.trim() === '') return;
    
    await mediaRepository.rename(id, newName.trim(), adminUser?.name || 'Admin');
    toast({
      title: "Asset Renamed",
      description: `Successfully renamed filename to "${newName.trim()}"`
    });
    loadMedia();
  };

  const handleReplaceClick = (id: string) => {
    setReplaceTargetId(id);
    setTimeout(() => {
      replaceInputRef.current?.click();
    }, 100);
  };

  const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetId) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Unsupported format",
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
        await mediaRepository.replace(
          replaceTargetId,
          dataUrl,
          file.size,
          adminUser?.name || 'Admin'
        );
        toast({
          title: "Asset Replaced",
          description: `Successfully updated image content.`
        });
        setReplaceTargetId(null);
        loadMedia();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({
        title: "Replacement failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = (assetId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(assetId);
    toast({
      title: "Link copied",
      description: "Asset address saved to clipboard."
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(f => f.id));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'External link';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading media vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Shared Media Library</h1>
          <p className="text-slate-500 text-xs mt-1">
            Store property photos, project galleries and company logos in one place.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <Button
            onClick={handleBulkDelete}
            className="bg-red-950/40 border border-red-900/60 hover:bg-red-900 text-red-200 rounded-lg text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Upload Pane */}
        <Card className="bg-slate-900 border-slate-800 text-white self-start">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Add Image to Vault</h2>
            
            {/* Upload File */}
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl p-8 text-center transition-colors group flex flex-col items-center justify-center cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-600 group-hover:text-blue-400 mb-2 transition-colors" />
                )}
                <span className="text-slate-300 text-xs font-semibold">Upload Local File</span>
                <span className="text-slate-600 text-[10px] mt-1">PNG, JPG, WEBP formats</span>
              </button>
            </div>

            <div className="flex items-center text-slate-700 text-xs">
              <span className="w-full border-t border-slate-800"></span>
              <span className="mx-2 text-[10px] uppercase font-semibold text-slate-650">or</span>
              <span className="w-full border-t border-slate-800"></span>
            </div>

            {/* External URL form */}
            <form onSubmit={handleAddExternal} className="space-y-2">
              <Label className="text-slate-400 text-[10px] uppercase font-semibold">Link External Image URL</Label>
              <div className="flex gap-1.5">
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="bg-slate-850 border-slate-700 text-xs text-white"
                  disabled={isUploading}
                />
                <Button type="submit" disabled={isUploading || !externalUrl} className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Media List / Grid Section */}
        <div className="md:col-span-2 space-y-4">
          {/* Controls Bar */}
          <Card className="bg-slate-900 border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search images by filename..."
                  className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-850 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter and Sort selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Type Filter */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-slate-850 border border-slate-800 rounded-md text-white px-2 py-0.5 focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">All Assets</option>
                    <option value="local">Local Uploads</option>
                    <option value="external">External Links</option>
                  </select>
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-850 border border-slate-800 rounded-md text-white px-2 py-0.5 focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="date">Date Uploaded</option>
                    <option value="name">Filename</option>
                    <option value="size">File Size</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="text-blue-400 hover:text-white px-1 font-bold uppercase text-[10px]"
                  >
                    {sortOrder}
                  </button>
                </div>
              </div>

              {/* Select All Checkbox trigger */}
              {filtered.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
                >
                  {selectedIds.length === filtered.length ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> : <Square className="w-3.5 h-3.5" />}
                  Toggle Select All ({selectedIds.length} selected)
                </button>
              )}
            </div>
          </Card>

          {/* Grid display */}
          {filtered.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 py-16 flex flex-col items-center justify-center text-slate-500 text-center">
              <ImageOff className="w-12 h-12 text-slate-800 mb-2" />
              <p className="text-white font-semibold">No media items match query</p>
              <p className="text-xs text-slate-650 mt-1">Clear search or upload new files.</p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {filtered.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={cn(
                      "group relative rounded-xl overflow-hidden bg-slate-900 border aspect-video flex flex-col justify-between transition-all",
                      isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-800"
                    )}
                  >
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    
                    {/* Select box top-left overlay */}
                    <button
                      type="button"
                      onClick={() => handleSelectRow(asset.id)}
                      className="absolute top-2 left-2 z-10 w-6 h-6 rounded bg-slate-950/80 border border-slate-700 flex items-center justify-center text-white"
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                    </button>

                    {/* Action overlays */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-3 text-white">
                      <div className="flex justify-end gap-1.5 ml-8">
                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(asset.id, asset.url)}
                          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Copy Image URL"
                        >
                          {copiedId === asset.id ? <ClipboardCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        
                        {/* Rename */}
                        <button
                          onClick={() => handleRename(asset.id, asset.name)}
                          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Rename File"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Replace content */}
                        <button
                          onClick={() => handleReplaceClick(asset.id)}
                          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Replace Image Content"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(asset.id, asset.name)}
                          className="p-1.5 rounded-lg bg-red-900 hover:bg-red-650 text-slate-200 hover:text-white transition-all"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate" title={asset.name}>{asset.name}</p>
                        <div className="flex justify-between items-center text-[8px] text-slate-400 mt-1">
                          <span>{formatSize(asset.size)}</span>
                          <span>{format(new Date(asset.createdAt), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View mode table */
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-850 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="p-3 w-10"></th>
                    <th className="p-3 w-16">Preview</th>
                    <th className="p-3">Filename</th>
                    <th className="p-3">Uploaded Date</th>
                    <th className="p-3">File Size</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filtered.map(asset => {
                    const isSelected = selectedIds.includes(asset.id);
                    return (
                      <tr key={asset.id} className={cn("hover:bg-slate-800/25 transition-colors", isSelected && "bg-slate-800/10")}>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleSelectRow(asset.id)}
                            className="text-slate-500 hover:text-white"
                          >
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" /> : <Square className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="w-10 h-10 rounded overflow-hidden bg-slate-950 border border-slate-800">
                            <img src={asset.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-white truncate max-w-[200px]" title={asset.name}>
                          {asset.name}
                        </td>
                        <td className="p-3 text-slate-400">
                          {format(new Date(asset.createdAt), 'dd/MM/yyyy')}
                        </td>
                        <td className="p-3 text-slate-550">
                          {formatSize(asset.size)}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button onClick={() => handleCopyLink(asset.id, asset.url)} className="p-1 text-slate-400 hover:text-white" title="Copy Link">
                            {copiedId === asset.id ? <ClipboardCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleRename(asset.id, asset.name)} className="p-1 text-slate-400 hover:text-white" title="Rename">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleReplaceClick(asset.id)} className="p-1 text-slate-400 hover:text-white" title="Replace">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(asset.id, asset.name)} className="p-1 text-red-400 hover:text-red-300" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for Replace action */}
      <input
        type="file"
        ref={replaceInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleReplaceUpload}
      />
    </div>
  );
};

export default AdminMedia;
