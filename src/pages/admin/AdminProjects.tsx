import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectRepository } from '@/admin/repositories/projectRepository';
import type { AdminProject } from '@/admin/types/admin';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  ImageOff,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Clock,
  Archive,
  Star
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

const AdminProjects = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [filtered, setFiltered] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    const list = await projectRepository.getAll();
    setProjects(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
      const saved = sessionStorage.getItem('nestora_workspace_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.statusFilter !== undefined) setStatusFilter(parsed.statusFilter);
        if (parsed.categoryFilter !== undefined) setCategoryFilter(parsed.categoryFilter);
        if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
      }
    } catch (e: any) {
      toast({ title: 'Workspace Load Failed', description: 'Could not restore previous session.', variant: 'destructive' });
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
        currentPage
      };
      sessionStorage.setItem('nestora_workspace_projects', JSON.stringify(stateToSave));
    } catch (e) {
      // ignore
    }
  }, [search, statusFilter, categoryFilter, currentPage, loading]);

  // Filtering & Sorting
  useEffect(() => {
    let result = [...projects];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
    }

    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [projects, search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleToggleStatus = async (id: string, status: AdminProject['status']) => {
    await projectRepository.setStatus(id, status, adminUser?.name || 'Admin');
    toast({
      title: "Project Status Updated",
      description: `Status updated successfully to ${status}.`
    });
    loadProjects();
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    await projectRepository.setFeatured(id, featured, adminUser?.name || 'Admin');
    toast({
      title: featured ? "Featured Project" : "Removed from Featured",
      description: "Project featured settings updated."
    });
    loadProjects();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await projectRepository.delete(deleteId, adminUser?.name || 'Admin');
    toast({
      title: "Project Deleted",
      description: "The project has been successfully soft-archived."
    });
    setDeleteId(null);
    loadProjects();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading projects portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Project Portfolio</h1>
          <p className="text-slate-500 text-xs mt-1">
            Displaying {filtered.length} of {projects.length} construction and engineering projects.
          </p>
        </div>
        <Link to="/admin/projects/new">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Project
          </Button>
        </Link>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card 
          onClick={() => setStatusFilter('all')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'all' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Projects</p>
          <p className="text-xl font-bold text-white mt-1">{projects.length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('Planning')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'Planning' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-slate-400">Planning</p>
          <p className="text-xl font-bold text-white mt-1">{projects.filter(p => p.status === 'Planning').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('In Progress')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'In Progress' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-amber-400">In Progress</p>
          <p className="text-xl font-bold text-white mt-1">{projects.filter(p => p.status === 'In Progress').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('Completed')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'Completed' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-green-400">Completed</p>
          <p className="text-xl font-bold text-white mt-1">{projects.filter(p => p.status === 'Completed').length}</p>
        </Card>

        <Card 
          onClick={() => setStatusFilter('Archived')}
          className={cn(
            "bg-slate-900 border-slate-800 p-3 text-center cursor-pointer transition-all hover:border-slate-700/80",
            statusFilter === 'Archived' && "border-blue-500/80 ring-1 ring-blue-500/80"
          )}
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-red-400">Archived</p>
          <p className="text-xl font-bold text-white mt-1">{projects.filter(p => p.status === 'Archived').length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
          >
            <option value="all">All Categories</option>
            <option value="Construction">Construction</option>
            <option value="Renovation">Renovation</option>
            <option value="Waterproofing">Waterproofing</option>
            <option value="Fabrication">Fabrication</option>
            <option value="Earthworks">Earthworks</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Planning">Planning</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </Card>

      {/* Projects Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <ImageOff className="w-12 h-12 text-slate-700 mb-3" />
            <h3 className="text-base font-bold text-white">No projects match filters</h3>
            <p className="text-xs text-slate-600 mt-1">Start by creating your first showcase project.</p>
            <Link to="/admin/projects/new" className="mt-4">
              <Button className="bg-blue-600 text-white hover:bg-blue-500">Add Project</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-300">
              <thead className="bg-slate-850/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 w-14">Cover Image</th>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4">Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {paginated.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-800/35 transition-colors">
                    {/* Cover Image */}
                    <td className="p-4">
                      <div className="w-12 h-12 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                        {project.image ? (
                          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-slate-700" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Project Name */}
                    <td className="p-4 font-semibold text-white truncate max-w-[200px]" title={project.title}>
                      {project.title}
                    </td>

                    {/* Category */}
                    <td className="p-4">{project.category}</td>

                    {/* Location */}
                    <td className="p-4 text-slate-400 font-medium">{project.location}</td>

                    {/* Status */}
                    <td className="p-4">
                      <StatusBadge status={project.status} />
                    </td>

                    {/* Featured */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(project.id, !project.featured)}
                        className={cn(
                          "hover:scale-110 transition-transform",
                          project.featured ? "text-yellow-400" : "text-slate-600 hover:text-slate-400"
                        )}
                      >
                        <Star className="w-4 h-4" fill={project.featured ? "currentColor" : "none"} />
                      </button>
                    </td>

                    {/* Updated Date */}
                    <td className="p-4 text-slate-400 font-medium">
                      {format(new Date(project.updatedAt), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                          <DropdownMenuItem onClick={() => navigate(`/admin/projects/edit/${project.id}`)} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                            <Pencil className="w-3.5 h-3.5" /> Edit details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="border-slate-800" />
                          <DropdownMenuItem onClick={() => handleToggleStatus(project.id, 'Completed')} className="text-xs text-green-400 hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                            <Check className="w-3.5 h-3.5" /> Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(project.id, 'In Progress')} className="text-xs text-amber-400 hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                            <Clock className="w-3.5 h-3.5" /> Set In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(project.id, 'Archived')} className="text-xs text-slate-400 hover:bg-slate-800 focus:bg-slate-800 py-2 cursor-pointer gap-2">
                            <Archive className="w-3.5 h-3.5" /> Archive project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="border-slate-800" />
                          <DropdownMenuItem onClick={() => setDeleteId(project.id)} className="text-xs text-red-500 hover:bg-red-950/20 focus:bg-red-950/20 py-2 cursor-pointer gap-2 font-semibold">
                            <Trash2 className="w-3.5 h-3.5" /> Delete (Soft)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
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
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs leading-normal">
              Are you sure you want to soft-delete and hide "{projects.find(p => p.id === deleteId)?.title}"? It will be removed from display, but remains archived in the databases.
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

export default AdminProjects;
