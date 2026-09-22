import { useEffect, useState, useCallback } from 'react';
import { enquiryRepository } from '@/admin/repositories/enquiryRepository';
import { employeeRepository } from '@/admin/repositories/employeeRepository';
import { propertyRepository } from '@/admin/repositories/propertyRepository';
import type { Enquiry, EnquiryStatus, EnquiryPriority, Employee, AdminProperty } from '@/admin/types/admin';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Search,
  MessageSquare,
  Clock,
  User,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle,
  TrendingUp,
  FileText,
  AlertCircle,
  Calendar,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatDistanceToNow } from 'date-fns';

const priorityColors: Record<EnquiryPriority, string> = {
  Low: 'bg-slate-800 text-slate-400 border-slate-700',
  Medium: 'bg-blue-900/40 text-blue-300 border-blue-900',
  High: 'bg-red-900/40 text-red-300 border-red-900'
};

const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filtered, setFiltered] = useState<Enquiry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Detail Modal
  const [selectedEnq, setSelectedEnq] = useState<Enquiry | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState<EnquiryStatus>('New');
  const [priority, setPriority] = useState<EnquiryPriority>('Medium');
  const [followUpDate, setFollowUpDate] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const [enqList, empList, propList] = await Promise.all([
      enquiryRepository.getAll(),
      employeeRepository.getAll(),
      propertyRepository.getAll()
    ]);
    setEnquiries(enqList);
    setEmployees(empList);
    setProperties(propList);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load workspace state from sessionStorage on mount (or URL parameters)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const priorityParam = params.get('priority');
    
    if (statusParam || priorityParam) {
      if (statusParam) setStatusFilter(statusParam);
      if (priorityParam) setPriorityFilter(priorityParam);
      return;
    }

    try {
      const saved = sessionStorage.getItem('nestora_workspace_enquiries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.statusFilter !== undefined) setStatusFilter(parsed.statusFilter);
        if (parsed.priorityFilter !== undefined) setPriorityFilter(parsed.priorityFilter);
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
        priorityFilter
      };
      sessionStorage.setItem('nestora_workspace_enquiries', JSON.stringify(stateToSave));
    } catch (e) {
      // ignore
    }
  }, [search, statusFilter, priorityFilter, loading]);

  // Filtering
  useEffect(() => {
    let result = [...enquiries];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        e => e.name.toLowerCase().includes(q) ||
             e.email.toLowerCase().includes(q) ||
             e.phone.toLowerCase().includes(q) ||
             e.message.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(e => e.priority === priorityFilter);
    }

    setFiltered(result);
  }, [enquiries, search, statusFilter, priorityFilter]);

  const handleOpenDetails = (enq: Enquiry) => {
    setSelectedEnq(enq);
    setInternalNotes(enq.internalNotes || '');
    setAssignedTo(enq.assignedTo || '');
    setStatus(enq.status);
    setPriority(enq.priority);
    setFollowUpDate(enq.followUpDate ? enq.followUpDate.split('T')[0] : '');
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnq) return;

    setSavingDetails(true);
    try {
      await enquiryRepository.update(selectedEnq.id, {
        internalNotes: internalNotes.trim(),
        assignedTo: assignedTo || undefined,
        status,
        priority,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined
      }, adminUser?.name || 'Admin');

      toast({
        title: "Enquiry Updated",
        description: `Successfully updated enquiry ID ${selectedEnq.id}`
      });
      setSelectedEnq(null);
      loadData();
    } catch (err: any) {
      toast({
        title: "Failed to update",
        description: err.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleQuickStatus = async (id: string, newStatus: EnquiryStatus) => {
    await enquiryRepository.updateStatus(id, newStatus, adminUser?.name || 'Admin');
    toast({
      title: "Status updated",
      description: `Enquiry status changed to ${newStatus}.`
    });
    loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete enquiry from "${name}"?`)) return;
    await enquiryRepository.delete(id, adminUser?.name || 'Admin');
    toast({
      title: "Enquiry deleted",
      description: "Selected enquiry record removed."
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading enquiries list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Customer Enquiries</h1>
        <p className="text-slate-500 text-xs mt-1">
          Review landing form logs, service requests and property interest.
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enquiries by name, text..."
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Site Visit">Site Visit</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </Card>

      {/* Grid of enquiries cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
          <MessageSquare className="w-12 h-12 text-slate-700 mb-2" />
          <p className="text-white font-bold">No enquiries found</p>
          <p className="text-xs text-slate-600 mt-1">Enjoy a clear inbox! Fresh contact requests will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((enq) => {
            const assigned = employees.find(e => e.id === enq.assignedTo);
            const property = enq.propertyId ? properties.find(p => p.id === enq.propertyId) : null;
            return (
              <Card
                key={enq.id}
                onClick={() => handleOpenDetails(enq)}
                className="bg-slate-900 border-slate-800 hover:border-slate-700 hover:scale-[1.01] transition-all cursor-pointer text-white flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white truncate">{enq.name}</h3>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                          Type: {enq.type}
                        </span>
                      </div>
                      <StatusBadge status={enq.status} />
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      "{enq.message}"
                    </p>

                    {property && (
                      <div className="bg-slate-950 p-2 rounded border border-slate-850 text-[10px] text-slate-400">
                        Interested: <span className="text-white font-semibold">{property.propertyCode} ({property.title})</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-850 pt-3 flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDistanceToNow(new Date(enq.createdAt), { addSuffix: true })}</span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-white rounded">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                        <DropdownMenuItem onClick={() => handleQuickStatus(enq.id, 'Contacted')} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-1.5 cursor-pointer gap-2">
                          <Phone className="w-3.5 h-3.5 text-amber-400" /> Mark Contacted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickStatus(enq.id, 'Site Visit')} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-1.5 cursor-pointer gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" /> Set Site Visit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickStatus(enq.id, 'Closed')} className="text-xs hover:bg-slate-800 focus:bg-slate-800 py-1.5 cursor-pointer gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Mark Closed
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="border-slate-800" />
                        <DropdownMenuItem onClick={() => handleDelete(enq.id, enq.name)} className="text-xs text-red-500 hover:bg-red-950/20 focus:bg-red-950/20 py-1.5 cursor-pointer gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> Delete record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedEnq} onOpenChange={(open) => !open && setSelectedEnq(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display text-white">
              Enquiry Detail Overview
            </DialogTitle>
          </DialogHeader>

          {selectedEnq && (
            <form onSubmit={handleSaveDetails} className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-sm text-white">{selectedEnq.name}</span>
                  <Badge className={cn("border font-bold uppercase text-[9px] px-1.5 py-0.5", priorityColors[selectedEnq.priority])}>
                    {selectedEnq.priority} Priority
                  </Badge>
                </div>
                
                <div className="space-y-1 text-slate-400">
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {selectedEnq.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {selectedEnq.phone}</p>
                </div>

                <div className="border-t border-slate-850 pt-2 text-slate-200 mt-2 whitespace-pre-wrap leading-relaxed">
                  "{selectedEnq.message}"
                </div>
              </div>

              {/* Status and Priority selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 text-xs font-semibold mb-1 block">Workflow Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EnquiryStatus)}
                    className="bg-slate-850 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <Label className="text-slate-400 text-xs font-semibold mb-1 block">Priority Level</Label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as EnquiryPriority)}
                    className="bg-slate-850 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Assignment & Follow up */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 text-xs font-semibold mb-1 block">Assigned Admin</Label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="bg-slate-850 border border-slate-700 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none py-1.5 px-3 cursor-pointer w-full"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-slate-400 text-xs font-semibold mb-1 block">Follow up Date</Label>
                  <Input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="bg-slate-850 border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <Label className="text-slate-400 text-xs font-semibold mb-1 block">Internal Action Notes</Label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                  placeholder="Record discussions, financial validation or site feedback..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-md p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedEnq(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-850 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingDetails}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  {savingDetails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Modifications'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEnquiries;
