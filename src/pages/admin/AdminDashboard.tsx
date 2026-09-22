import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { propertyRepository } from '@/admin/repositories/propertyRepository';
import { projectRepository } from '@/admin/repositories/projectRepository';
import { servicesRepository } from '@/admin/repositories/servicesRepository';
import { enquiryRepository } from '@/admin/repositories/enquiryRepository';
import { employeeRepository } from '@/admin/repositories/employeeRepository';
import { getRecentActivity } from '@/admin/repositories/activityRepository';
import type { ActivityLog, AdminProperty, Enquiry } from '@/admin/types/admin';
import {
  Building2,
  FolderOpen,
  Wrench,
  MessageSquare,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  UserCheck,
  Home,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [draftProperties, setDraftProperties] = useState<AdminProperty[]>([]);
  const [newEnquiries, setNewEnquiries] = useState<Enquiry[]>([]);
  const navigate = useNavigate();

  // Metrics state
  const [properties, setProperties] = useState({
    total: 0, published: 0, draft: 0, negotiation: 0, sold: 0, rented: 0, archived: 0
  });
  const [projects, setProjects] = useState({ total: 0, completed: 0, inProgress: 0, planning: 0 });
  const [services, setServices] = useState({ total: 0, enabled: 0 });
  const [enquiries, setEnquiries] = useState({ total: 0, new: 0, contacted: 0, siteVisit: 0, negotiation: 0, closed: 0 });
  const [employees, setEmployees] = useState({ total: 0, active: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const [allProps, allProjects, allServices, allEnquiries, allEmployees, recentLogs] = await Promise.all([
        propertyRepository.getAll(),
        projectRepository.getAll(),
        servicesRepository.getAll(),
        enquiryRepository.getAll(),
        employeeRepository.getAll(),
        getRecentActivity(8)
      ]);

      // Count property statuses
      setProperties({
        total: allProps.length,
        published: allProps.filter(p => p.status === 'published').length,
        draft: allProps.filter(p => p.status === 'draft').length,
        negotiation: allProps.filter(p => p.status === 'under_negotiation').length,
        sold: allProps.filter(p => p.status === 'sold').length,
        rented: allProps.filter(p => p.status === 'rented').length,
        archived: allProps.filter(p => p.status === 'archived').length,
      });

      // Filter drafts and new enquiries for operational lists
      setDraftProperties(allProps.filter(p => p.status === 'draft').slice(0, 3));
      setNewEnquiries(allEnquiries.filter(e => e.status === 'New').slice(0, 3));

      // Projects
      setProjects({
        total: allProjects.length,
        completed: allProjects.filter(p => p.status === 'Completed').length,
        inProgress: allProjects.filter(p => p.status === 'In Progress').length,
        planning: allProjects.filter(p => p.status === 'Planning').length,
      });

      // Services
      setServices({
        total: allServices.length,
        enabled: allServices.filter(s => s.enabled).length,
      });

      // Enquiries
      setEnquiries({
        total: allEnquiries.length,
        new: allEnquiries.filter(e => e.status === 'New').length,
        contacted: allEnquiries.filter(e => e.status === 'Contacted').length,
        siteVisit: allEnquiries.filter(e => e.status === 'Site Visit').length,
        negotiation: allEnquiries.filter(e => e.status === 'Negotiation').length,
        closed: allEnquiries.filter(e => e.status === 'Closed').length,
      });

      // Employees
      setEmployees({
        total: allEmployees.length,
        active: allEmployees.filter(e => e.status === 'Active').length,
      });

      setLogs(recentLogs);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl"></div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-900 rounded-xl md:col-span-2"></div>
          <div className="h-64 bg-slate-900 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Console Dashboard</h1>
        <p className="text-slate-500 text-xs mt-0.5">Nestora Hub Business Operating Command Center.</p>
      </div>

      {/* TODAY'S BUSINESS SUMMARY ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700/80 transition-all cursor-pointer" onClick={() => navigate('/admin/enquiries?status=New')}>
          <CardContent className="p-4 flex items-center gap-4 text-white">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <MessageSquare className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{enquiries.new}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">New Unaddressed Enquiries</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700/80 transition-all cursor-pointer" onClick={() => navigate('/admin/properties?status=under_negotiation')}>
          <CardContent className="p-4 flex items-center gap-4 text-white">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{properties.negotiation}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Properties Under Negotiation</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700/80 transition-all cursor-pointer" onClick={() => navigate('/admin/employees?status=Active')}>
          <CardContent className="p-4 flex items-center gap-4 text-white">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{employees.active}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Active Staff Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS PANEL */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-5 text-white">
          <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Operational Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link to="/admin/properties/new">
              <Button className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-5 rounded-lg flex items-center gap-2 justify-center h-10">
                <Plus className="w-3.5 h-3.5 text-blue-400" /> Add Property
              </Button>
            </Link>
            <Link to="/admin/projects/new">
              <Button className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-5 rounded-lg flex items-center gap-2 justify-center h-10">
                <Plus className="w-3.5 h-3.5 text-purple-400" /> Add Project
              </Button>
            </Link>
            <Link to="/admin/services">
              <Button className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-5 rounded-lg flex items-center gap-2 justify-center h-10">
                <Plus className="w-3.5 h-3.5 text-cyan-400" /> Manage Services
              </Button>
            </Link>
            <Link to="/admin/enquiries">
              <Button className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-5 rounded-lg flex items-center gap-2 justify-center h-10">
                <MessageSquare className="w-3.5 h-3.5 text-red-400" /> View Enquiries
              </Button>
            </Link>
            <Link to="/admin/homepage">
              <Button className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-5 rounded-lg flex items-center gap-2 justify-center h-10">
                <Home className="w-3.5 h-3.5 text-green-400" /> Edit Website CMS
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* RECENT ACTIVITY & METRIC SUMMARIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric summary grid */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Module Summaries</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Properties Summary */}
              <Card className="bg-slate-900 border-slate-800 hover:border-slate-750 transition-all cursor-pointer text-white" onClick={() => navigate('/admin/properties')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-400" /> Properties ({properties.total})
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Pub</p>
                      <p className="text-base font-bold text-green-400 mt-0.5">{properties.published}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Drafts</p>
                      <p className="text-base font-bold text-amber-400 mt-0.5">{properties.draft}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Negotiate</p>
                      <p className="text-base font-bold text-blue-400 mt-0.5">{properties.negotiation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Summary */}
              <Card className="bg-slate-900 border-slate-800 hover:border-slate-750 transition-all cursor-pointer text-white" onClick={() => navigate('/admin/projects')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-purple-400" /> Projects ({projects.total})
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Done</p>
                      <p className="text-base font-bold text-green-400 mt-0.5">{projects.completed}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active</p>
                      <p className="text-base font-bold text-amber-400 mt-0.5">{projects.inProgress}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Plan</p>
                      <p className="text-base font-bold text-slate-400 mt-0.5">{projects.planning}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Summary */}
              <Card className="bg-slate-900 border-slate-800 hover:border-slate-750 transition-all cursor-pointer text-white" onClick={() => navigate('/admin/services')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-cyan-400" /> Services Directory
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="flex gap-4 justify-around text-center text-xs py-1">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Registered</p>
                      <p className="text-xl font-bold mt-0.5">{services.total}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active on Site</p>
                      <p className="text-xl font-bold text-green-400 mt-0.5">{services.enabled}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enquiries Summary */}
              <Card className="bg-slate-900 border-slate-800 hover:border-slate-750 transition-all cursor-pointer text-white" onClick={() => navigate('/admin/enquiries')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-red-400" /> Enquiries ({enquiries.total})
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <p className="text-slate-500">New</p>
                      <p className="text-xs font-bold text-red-400">{enquiries.new}</p>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <p className="text-slate-500">Contact</p>
                      <p className="text-xs font-bold text-amber-400">{enquiries.contacted}</p>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <p className="text-slate-500">Visit</p>
                      <p className="text-xs font-bold text-blue-400">{enquiries.siteVisit}</p>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <p className="text-slate-500">Closed</p>
                      <p className="text-xs font-bold text-green-400">{enquiries.closed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actionable Drafts & Pending Enquiries lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Draft Properties */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Draft Properties</h3>
                  <Link to="/admin/properties?status=draft" className="text-[10px] text-blue-400 hover:underline">View All</Link>
                </div>
                {draftProperties.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-4">No draft properties in backlog.</p>
                ) : (
                  <div className="space-y-2">
                    {draftProperties.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-850 last:border-0">
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-slate-200">{p.title}</p>
                          <span className="text-[10px] text-slate-500">{p.propertyCode} · {p.category}</span>
                        </div>
                        <Button 
                          onClick={() => navigate(`/admin/properties/edit/${p.id}`)}
                          className="h-7 text-[10px] px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded"
                        >
                          Publish
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Enquiries */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">New Enquiries</h3>
                  <Link to="/admin/enquiries?status=New" className="text-[10px] text-blue-400 hover:underline">View All</Link>
                </div>
                {newEnquiries.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-4">No new customer enquiries.</p>
                ) : (
                  <div className="space-y-2">
                    {newEnquiries.map(e => (
                      <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-850 last:border-0">
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-slate-200">{e.name}</p>
                          <span className="text-[10px] text-slate-500 truncate block">{e.message}</span>
                        </div>
                        <Button 
                          onClick={() => navigate('/admin/enquiries')}
                          className="h-7 text-[10px] px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded"
                        >
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 text-white flex flex-col h-full">
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Activity Log
            </h2>

            {logs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs py-8">
                No logged entries yet.
              </div>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[320px] scrollbar-none pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/80 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-300 leading-snug">
                        <span className="font-semibold text-white">{log.user}</span> {log.action}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
