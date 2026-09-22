import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { propertyRepository } from '@/admin/repositories/propertyRepository';
import { employeeRepository } from '@/admin/repositories/employeeRepository';
import type { AdminProperty, PropertyStatus } from '@/admin/types/admin';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Star,
  Loader2,
  ImageOff,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  CheckCircle2,
  Copy,
  Archive,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 8;

const AdminProperties = () => {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [filtered, setFiltered] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof AdminProperty>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadProperties = useCallback(async () => {
    const list = await propertyRepository.getAll();
    setProperties(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Load workspace state from sessionStorage on mount (or URL parameters)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const categoryParam = params.get('category');
    
    if (statusParam || categoryParam) {
      if (statusParam) setStatusFilter(statusParam);
      if (categoryParam) setCategoryFilter(categoryParam);
      setCurrentPage(1);
      return;
    }

    try {
      const saved = sessionStorage.getItem('nestora_workspace_properties');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.statusFilter !== undefined) setStatusFilter(parsed.statusFilter);
        if (parsed.categoryFilter !== undefined) setCategoryFilter(parsed.categoryFilter);
        if (parsed.sortField !== undefined) setSortField(parsed.sortField);
        if (parsed.sortOrder !== undefined) setSortOrder(parsed.sortOrder);
        if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save workspace state to sessionStorage whenever it changes
  useEffect(() => {
    if (loading) return;
    try {
      const stateToSave = {
        search,
        statusFilter,
        categoryFilter,
        sortField,
        sortOrder,
        currentPage
      };
      sessionStorage.setItem('nestora_workspace_properties', JSON.stringify(stateToSave));
    } catch (e) {
      // ignore
    }
  }, [search, statusFilter, categoryFilter, sortField, sortOrder, currentPage, loading]);

  // Filtering & Sorting
  useEffect(() => {
    let result = [...properties];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) ||
             p.propertyCode.toLowerCase().includes(q) ||
             p.address.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = (valA as string).toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(result);
    setCurrentPage(1); // Reset to page 1 on filter
  }, [properties, search, statusFilter, categoryFilter, sortField, sortOrder]);

  // Pagination bounds
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Bulk selectors
  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(p => p.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Actions
  const handleToggleStatus = async (id: string, status: PropertyStatus) => {
    const updated = await propertyRepository.setStatus(id, status, adminUser?.name || 'Admin');
    toast({
      title: `Property status updated`,
      description: `Property ${updated.propertyCode} is now set to ${status}.`
    });
    loadProperties();
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    const updated = await propertyRepository.setFeatured(id, featured, adminUser?.name || 'Admin');
    toast({
      title: featured ? "Added to Featured" : "Removed from Featured",
      description: `Property ${updated.propertyCode} updated successfully.`
    });
    loadProperties();
  };

  const handleDuplicate = async (property: AdminProperty) => {
    const { id, propertyCode, createdAt, updatedAt, ...rest } = property;
    const duplicated = await propertyRepository.create({
      ...rest,
      title: `${rest.title} (Copy)`,
      status: 'draft',
      featured: false
    }, adminUser?.name || 'Admin');

    toast({
      title: "Property Duplicated",
      description: `New property created as draft: ${duplicated.propertyCode}`
    });
    loadProperties();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await propertyRepository.delete(deleteId, adminUser?.name || 'Admin');
    toast({
      title: "Property Deleted",
      description: `The property listing has been soft-deleted from active display.`
    });
    setDeleteId(null);
    loadProperties();
  };

  // Bulk Actions
  const handleBulkStatusChange = async (status: PropertyStatus) => {
    await Promise.all(selectedIds.map(id => propertyRepository.setStatus(id, status, adminUser?.name || 'Admin')));
    toast({
      title: "Bulk Status Updated",
      description: `Set ${selectedIds.length} properties to ${status}.`
    });
    setSelectedIds([]);
    loadProperties();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected properties?`)) return;
    await Promise.all(selectedIds.map(id => propertyRepository.delete(id, adminUser?.name || 'Admin')));
    toast({
      title: "Bulk Delete Successful",
      description: `Soft-deleted ${selectedIds.length} properties.`
    });
    setSelectedIds([]);
    loadProperties();
  };

  const handleExportCSV = () => {
    const headers = ['Property Code', 'Title', 'Category', 'Purpose', 'Address', 'Price', 'Status', 'Featured', 'Updated At'];
    const rows = filtered.map(p => [
      p.propertyCode,
      p.title,
      p.category,
      p.type,
      p.address,
      p.price,
      p.status,
      p.featured ? 'Yes' : 'No',
      p.updatedAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nestora_properties_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Data Exported",
      description: `Successfully exported ${filtered.length} properties to CSV.`
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading properties database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Properties Directory</h1>
          <p className="text-slate-500 text-xs mt-1">
            Displaying {filtered.length} of {properties.length} total property units.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            onClick={handleExportCSV} 
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs h-9"
          >
            Export CSV
          </Button>
          <Link to="/admin/properties/new">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 h-9 text-xs">
              <Plus className="w-4 h-4" /> Add Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card 
          onClick={() => setStatusFilter('all')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'all' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-white mt-1">{properties.length}</p>
        </Card>
        
        <Card 
          onClick={() => setStatusFilter('published')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'published' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-green-400">Published</p>
          <p className="text-xl font-bold text-white mt-1">{properties.filter(p => p.status === 'published').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('draft')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'draft' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-slate-400">Drafts</p>
          <p className="text-xl font-bold text-white mt-1">{properties.filter(p => p.status === 'draft').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('under_negotiation')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'under_negotiation' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-amber-400">Negotiating</p>
          <p className="text-xl font-bold text-white mt-1">{properties.filter(p => p.status === 'under_negotiation').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('sold')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'sold' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-blue-400">Sold</p>
          <p className="text-xl font-bold text-white mt-1">{properties.filter(p => p.status === 'sold').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('rented')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'rented' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-purple-400">Rented</p>
          <p className="text-xl font-bold text-white mt-1">{properties.filter(p => p.status === 'rented').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('archived')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'archived' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-red-400">Archived</p>
          <p className="text-xl font-bold text-white mt-1">{properties.filter(p => p.status === 'archived').length}</p>
        </Card>
      </div>

      {/* SEARCH / FILTERS */}
      <Card className="bg-slate-900 border-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, title..."
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 text-white">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 focus:outline-none w-full py-1.5 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="draft" className="bg-slate-900">Draft</option>
              <option value="published" className="bg-slate-900">Published</option>
              <option value="under_negotiation" className="bg-slate-900">Under Negotiation</option>
              <option value="sold" className="bg-slate-900">Sold</option>
              <option value="rented" className="bg-slate-900">Rented</option>
              <option value="archived" className="bg-slate-900">Archived</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 text-white">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 focus:outline-none w-full py-1.5 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Categories</option>
              <option value="Residential" className="bg-slate-900">Residential</option>
              <option value="Commercial" className="bg-slate-900">Commercial</option>
              <option value="Plots & Land" className="bg-slate-900">Plots & Land</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 text-white">
            <span className="text-slate-500 text-xs font-semibold">Sort:</span>
            <select
              value={`${sortField}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortField(field as keyof AdminProperty);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 focus:outline-none w-full py-1.5 cursor-pointer"
            >
              <option value="createdAt_desc" className="bg-slate-900">Newest Created</option>
              <option value="createdAt_asc" className="bg-slate-900">Oldest Created</option>
              <option value="title_asc" className="bg-slate-900">Title (A-Z)</option>
              <option value="title_desc" className="bg-slate-900">Title (Z-A)</option>
              <option value="price_asc" className="bg-slate-900">Price (Low-High)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* BULK ACTIONS BANNER */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-900/30 border border-blue-800/80 p-3 rounded-lg text-white">
          <span className="text-xs font-semibold">{selectedIds.length} properties selected</span>
          <div className="flex gap-2">
            <Button size="xs" onClick={() => handleBulkStatusChange('published')} className="bg-green-600 text-xs py-1 px-3">Publish</Button>
            <Button size="xs" onClick={() => handleBulkStatusChange('archived')} className="bg-slate-700 text-xs py-1 px-3">Archive</Button>
            <Button size="xs" onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-500 text-xs py-1 px-3">Delete</Button>
            <Button size="xs" variant="ghost" onClick={() => setSelectedIds([])} className="text-slate-400 text-xs hover:text-white">Clear</Button>
          </div>
        </div>
      )}

      {/* PROPERTIES TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <ImageOff className="w-12 h-12 text-slate-700 mb-3" />
            <h3 className="text-base font-bold text-white">No properties match your filters</h3>
            <p className="text-xs text-slate-600 mt-1">Start by resetting filters or add a new property listing.</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); }} variant="outline" className="border-slate-850 text-slate-400 hover:text-white">
                Reset Filters
              </Button>
              <Link to="/admin/properties/new">
                <Button className="bg-blue-600 text-white hover:bg-blue-500">Add Property</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-slate-300">
              <thead className="bg-slate-850/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 z-10">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginated.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 text-blue-600 bg-slate-800 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-14">Thumbnail</th>
                  <th className="p-4">Property Code</th>
                  <th className="p-4">Property Name</th>
                  <th className="p-4 hidden sm:table-cell">Category</th>
                  <th className="p-4 hidden md:table-cell">Purpose</th>
                  <th className="p-4 hidden md:table-cell">City</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 hidden lg:table-cell">Featured</th>
                  <th className="p-4 hidden lg:table-cell">Updated Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {paginated.map((property) => {
                  const isChecked = selectedIds.includes(property.id);
                  return (
                    <tr
                      key={property.id}
                      className={cn(
                        "hover:bg-slate-800/35 transition-colors",
                        isChecked && "bg-slate-800/20"
                      )}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(property.id)}
                          className="rounded border-slate-700 text-blue-600 bg-slate-800 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="p-4">
                        <div className="w-12 h-12 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                          {property.image ? (
                            <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageOff className="w-4 h-4 text-slate-700" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Property Code */}
                      <td className="p-4 font-mono font-bold text-slate-400">{property.propertyCode}</td>

                      {/* Property Name */}
                      <td className="p-4 font-semibold text-white truncate max-w-[180px]" title={property.title}>
                        {property.title}
                      </td>

                      {/* Category */}
                      <td className="p-4 hidden sm:table-cell">{property.category}</td>

                      {/* Purpose (Sale / Rent) */}
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px] py-0 border-slate-700 text-slate-300">
                          {property.type === 'For Sale' ? 'Sale' : 'Rent'}
                        </Badge>
                      </td>

                      {/* City */}
                      <td className="p-4 hidden md:table-cell text-slate-400 truncate max-w-[120px]" title={property.address}>
                        {property.address.split(',').pop()?.trim() || 'Mumbai'}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-bold text-white">{property.price}</td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={property.status} />
                      </td>

                      {/* Featured */}
                      <td className="p-4 hidden lg:table-cell">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(property.id, !property.featured)}
                          className={cn(
                            "hover:scale-110 transition-transform",
                            property.featured ? "text-yellow-400" : "text-slate-600 hover:text-slate-400"
                          )}
                        >
                          <Star className="w-4 h-4" fill={property.featured ? "currentColor" : "none"} />
                        </button>
                      </td>

                      {/* Updated Date */}
                      <td className="p-4 hidden lg:table-cell text-slate-400 font-medium">
                        {format(new Date(property.updatedAt), 'dd/MM/yyyy')}
                      </td>

                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                            <DropdownMenuItem onClick={() => navigate(`/admin/properties/edit/${property.id}`)} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                              <Pencil className="w-3.5 h-3.5" /> Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(property)} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                              <Copy className="w-3.5 h-3.5" /> Duplicate Unit
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="border-slate-800" />
                            
                            <DropdownMenuItem onClick={() => handleToggleStatus(property.id, 'published')} className="text-xs text-green-400 hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                              <Eye className="w-3.5 h-3.5" /> Publish listing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(property.id, 'under_negotiation')} className="text-xs text-amber-400 hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                              <TrendingUp className="w-3.5 h-3.5" /> Set Negotiation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(property.id, 'archived')} className="text-xs text-slate-400 hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                              <Archive className="w-3.5 h-3.5" /> Archive listing
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="border-slate-800" />
                            
                            <DropdownMenuItem onClick={() => setDeleteId(property.id)} className="text-xs text-red-500 hover:bg-red-950/20 focus:bg-red-950/20 py-2 cursor-pointer gap-2 font-semibold">
                              <Trash2 className="w-3.5 h-3.5" /> Delete (Soft)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-3 bg-slate-900/60 text-slate-400 text-xs">
            <span>Showing page {currentPage} of {totalPages} ({filtered.length} matching)</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="border-slate-800 hover:bg-slate-850 w-8 h-8 p-0 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="border-slate-800 hover:bg-slate-850 w-8 h-8 p-0 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property Listing?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs leading-normal">
              This will soft-delete and hide "{properties.find((p) => p.id === deleteId)?.title}" from both the public directory and standard lists. History record remains archived for employee audits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProperties;
