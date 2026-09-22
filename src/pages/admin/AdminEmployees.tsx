import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeRepository } from '@/admin/repositories/employeeRepository';
import type { Employee, EmployeeStatus } from '@/admin/types/admin';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { hashPassword } from '@/admin/lib/auth';
import { hasPermission, PERMISSIONS } from '@/admin/lib/permissions';
import {
  Plus,
  User,
  ShieldAlert,
  Loader2,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  KeyRound,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 6;



const AdminEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter workspace states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'lastLogin'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const canManageEmployees = hasPermission(adminUser?.role, PERMISSIONS.MANAGE_EMPLOYEES);

  const loadEmployees = useCallback(async () => {
    const list = await employeeRepository.getAll();
    setEmployees(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Redirect users without manage employees permission away from this page
  useEffect(() => {
    if (adminUser && !hasPermission(adminUser.role, PERMISSIONS.MANAGE_EMPLOYEES)) {
      toast({ title: 'Access Restricted', description: 'You do not have permission to manage employees.', variant: 'destructive' });
      navigate('/admin/dashboard');
    }
  }, [adminUser, navigate, toast]);

  // Load workspace state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('nestora_workspace_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.statusFilter !== undefined) setStatusFilter(parsed.statusFilter);
        if (parsed.sortField !== undefined) setSortField(parsed.sortField);
        if (parsed.sortOrder !== undefined) setSortOrder(parsed.sortOrder);
        if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
      }
    } catch (e) {
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
        sortField,
        sortOrder,
        currentPage
      };
      sessionStorage.setItem('nestora_workspace_employees', JSON.stringify(stateToSave));
    } catch (e) {
      console.error(e);
    }
  }, [search, statusFilter, sortField, sortOrder, currentPage, loading]);

  // Filtering & Sorting
  useEffect(() => {
    let result = [...employees];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        e => e.name.toLowerCase().includes(q) ||
             e.username.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }

    // Sort order
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'createdAt' || sortField === 'lastLogin') {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(result);
    setCurrentPage(1);
  }, [employees, search, statusFilter, sortField, sortOrder]);

  const activeAdminCount = employees.filter(e => e.role === 'Admin' && e.status !== 'Deactivated').length;
  const isLimitReached = activeAdminCount >= 2;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleOpenAdd = () => {
    if (!canManageEmployees) {
      toast({
        title: "Action Restricted",
        description: "You do not have permission to manage admin accounts.",
        variant: "destructive"
      });
      return;
    }

    if (isLimitReached) {
      toast({
        title: "Limit Reached",
        description: "Maximum limit of 2 active Admin accounts is already reached.",
        variant: "destructive"
      });
      return;
    }

    setName('');
    setUsername('');
    setPassword('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setFormError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const passHash = await hashPassword(password);
      await employeeRepository.create(
        name.trim(),
        username.trim(),
        passHash,
        'Admin',
        adminUser?.name || 'Super Admin'
      );

      toast({
        title: "Admin Created",
        description: `Successfully added "${name}" as Admin user.`
      });
      setIsModalOpen(false);
      loadEmployees();
    } catch (e: any) {
      setFormError(e.message || 'An error occurred during save.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: EmployeeStatus) => {
    if (!canManageEmployees) {
      toast({
        title: "Action Restricted",
        description: "You do not have permission to update employee status.",
        variant: "destructive"
      });
      return;
    }

    try {
      await employeeRepository.updateStatus(id, status, adminUser?.name || 'Super Admin');
      toast({
        title: "Employee Status Changed",
        description: `Status updated successfully to ${status}.`
      });
      loadEmployees();
    } catch (e: any) {
      toast({ title: 'Update Failed', description: e.message || 'Failed to update employee status.', variant: 'destructive' });
    }
  };

  const toggleSort = (field: 'name' | 'createdAt' | 'lastLogin') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading employee registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Employee Management</h1>
          <p className="text-slate-500 text-xs mt-1">
            Displaying registered console administrators. Active Admin count: {activeAdminCount} / 2.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          disabled={isLimitReached || !canManageEmployees}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
        >
          <Plus className="w-4 h-4" /> Create Admin
        </Button>
      </div>

      {/* Constraints Notice */}
      {!canManageEmployees && (
        <div className="flex items-start gap-2.5 bg-yellow-950/20 border border-yellow-900/50 p-3 rounded-lg text-yellow-400">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span>You have restricted permissions. You can review profiles in read-only mode.</span>
          </div>
        </div>
      )}

      {isLimitReached && canManageEmployees && (
        <div className="flex items-start gap-2.5 bg-blue-950/25 border border-blue-900/50 p-3 rounded-lg text-blue-400 text-xs max-w-2xl leading-normal">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>The console is configured for a maximum limit of 2 active Admin seats. Deactivate (soft-delete) or suspend an existing account to make room.</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 border border-slate-800/80 p-3 rounded-xl max-w-5xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-9 bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-lg"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 h-9 flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-[11px] font-medium text-slate-300 focus:outline-none cursor-pointer pr-4"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 h-9 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [any, any];
                setSortField(field);
                setSortOrder(order);
              }}
              className="bg-transparent border-none text-[11px] font-medium text-slate-300 focus:outline-none cursor-pointer pr-4"
            >
              <option value="createdAt-desc">Date: Newest First</option>
              <option value="createdAt-asc">Date: Oldest First</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="lastLogin-desc">Activity: Recent First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {paginated.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center max-w-5xl">
          <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1 font-display">No Employees Found</h3>
          <p className="text-slate-500 text-xs max-w-xs mx-auto mb-4">
            No administrator records match your current search queries or applied filters.
          </p>
          {(search || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="text-xs border-slate-700 hover:bg-slate-850 text-slate-300 rounded-lg"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {paginated.map((emp) => (
              <Card
                key={emp.id}
                className={cn(
                  "bg-slate-900 border-slate-800 text-white hover:border-slate-700/80 transition-all",
                  emp.status !== 'Active' && "opacity-60"
                )}
              >
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-slate-400 border border-slate-800">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{emp.name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">@{emp.username}</span>
                      </div>
                    </div>

                    <StatusBadge status={emp.status} />
                  </div>

                  <div className="space-y-1.5 text-[10px] text-slate-400 border-t border-slate-800/85 pt-3">
                    <p className="flex justify-between">
                      <span>Console Role:</span>
                      <span className="text-white font-bold">{emp.role}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Registered:</span>
                      <span className="text-slate-300">{format(new Date(emp.createdAt), 'PPP')}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Last session activity:</span>
                      <span className="text-slate-300">
                        {emp.lastLogin ? format(new Date(emp.lastLogin), 'Pp') : 'Never logged in'}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  {canManageEmployees && emp.role !== 'Super Admin' && (
                    <div className="flex justify-end pt-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-white rounded">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                          {emp.status !== 'Active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(emp.id, 'Active')} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-1.5 cursor-pointer gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Reactivate Profile
                            </DropdownMenuItem>
                          )}
                          {emp.status === 'Active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(emp.id, 'Suspended')} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-1.5 cursor-pointer gap-2">
                              <XCircle className="w-3.5 h-3.5 text-amber-400" /> Suspend Profile
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="border-slate-800" />
                          <DropdownMenuItem onClick={() => handleStatusChange(emp.id, 'Deactivated')} className="text-xs text-red-500 hover:bg-red-950/20 focus:bg-red-950/20 py-1.5 cursor-pointer gap-2 font-semibold">
                            <Trash2 className="w-3.5 h-3.5" /> Deactivate (Soft-Delete)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-850 pt-4 max-w-5xl">
              <span className="text-[10px] text-slate-500 font-medium">
                Page {currentPage} of {totalPages} ({filtered.length} employees)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-lg border-slate-800 text-slate-400 hover:text-white"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-lg border-slate-800 text-slate-400 hover:text-white"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display text-white">
              Create Admin Seat
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 text-xs text-slate-300">
            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1 block">Full Employee Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Akshay Patil"
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1 block">Username / ID *</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. akshay"
                className="bg-slate-950 border-slate-800 text-white text-xs font-mono h-9"
              />
            </div>

            <div>
              <Label className="text-slate-400 text-xs font-semibold mb-1 block">Password *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            {formError && <p className="text-red-400 text-xs">{formError}</p>}

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-850 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Profile'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmployees;
