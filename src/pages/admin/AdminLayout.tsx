import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { hasPermission, PERMISSIONS } from '@/admin/lib/permissions';
import { EmployeeRoleType } from '@/admin/types/admin';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  Wrench,
  MessageSquare,
  Image,
  Home,
  Users,
  LogOut,
  Menu,
  ChevronRight,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const baseNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Properties', to: '/admin/properties', icon: <Building2 className="w-4 h-4" /> },
  { label: 'Projects', to: '/admin/projects', icon: <FolderOpen className="w-4 h-4" /> },
  { label: 'Services', to: '/admin/services', icon: <Wrench className="w-4 h-4" /> },
  { label: 'Enquiries', to: '/admin/enquiries', icon: <MessageSquare className="w-4 h-4" /> },
  { label: 'Media Library', to: '/admin/media', icon: <Image className="w-4 h-4" /> },
  { label: 'Website CMS', to: '/admin/cms', icon: <Home className="w-4 h-4" /> },
];

function buildNavItems(role: EmployeeRoleType | undefined | null): NavItem[] {
  const items = [...baseNavItems];
  
  if (hasPermission(role, PERMISSIONS.MANAGE_EMPLOYEES)) {
    items.push({ label: 'Employees', to: '/admin/employees', icon: <Users className="w-4 h-4" /> });
  }
  return items;
}

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { adminLogout, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Business Command Center';
    if (path.includes('/admin/properties')) return 'Properties Directory';
    if (path.includes('/admin/projects')) return 'Project Showcase Portfolio';
    if (path.includes('/admin/services')) return 'Services Directory';
    if (path.includes('/admin/enquiries')) return 'Customer Enquiries Manager';
    if (path.includes('/admin/media')) return 'Shared Media Asset Manager';
    if (path.includes('/admin/homepage') || path.includes('/admin/cms')) return 'Website CMS Editor';
    if (path.includes('/admin/employees')) return 'Employee Directory';
    return 'Business Operating Console';
  };

  const SidebarContent = () => {
    const items = buildNavItems(adminUser?.role);

    return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-white">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/20">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm font-display tracking-wide">
              Nestora<span className="text-blue-400">Hub</span>
            </span>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">Operating Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group border-l-2 border-transparent',
                isActive
                  ? 'bg-slate-800/80 text-white border-l-blue-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
              )
            }
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Profile info & Logout */}
      <div className="px-4 py-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white font-bold truncate">{adminUser?.name || 'Super Admin'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide truncate">{adminUser?.role || 'Super Admin'}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
  };

  return (
    <div className="dark min-h-screen bg-slate-950 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 fixed top-0 bottom-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-56 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-slate-900 border-b border-slate-800/80 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Global Search Component */}
          <div className="flex-1 flex justify-start">
            <GlobalSearch />
          </div>

          <span className="hidden sm:inline-block text-slate-500 text-[10px] uppercase font-bold tracking-wider mr-2">
            Nestora Hub Console
          </span>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Section Breadcrumbs */}
          <div className="mb-4 text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-400 font-medium">{getPageTitle()}</span>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
