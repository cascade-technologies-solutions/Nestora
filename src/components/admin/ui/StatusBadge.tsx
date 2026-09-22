import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Global map for standardizing badge colors across the admin dashboard.
// These include all statuses for Properties, Projects, Enquiries, and Employees.
const statusColorMap: Record<string, string> = {
  // Common states
  Active: 'bg-green-600/20 text-green-400 border-green-600/30',
  Draft: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  Suspended: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  Deactivated: 'bg-red-600/20 text-red-400 border-red-600/30',
  Archived: 'bg-slate-700/50 text-slate-400 border-slate-700',
  
  // Property/Project states
  Published: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  'Under Negotiation': 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  Sold: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  Rented: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30',
  Completed: 'bg-green-600/20 text-green-400 border-green-600/30',
  'In Progress': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Planned: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  
  New: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Contacted: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  'Site Visit': 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30',
  Negotiation: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  Closed: 'bg-green-600/20 text-green-400 border-green-600/30',
  Read: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  Replied: 'bg-green-600/20 text-green-400 border-green-600/30',
  
  // Enquiry Priority
  High: 'bg-red-600/20 text-red-400 border-red-600/30',
  Medium: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  Low: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColorMap[status] || 'bg-slate-600/20 text-slate-400 border-slate-600/30';
  
  return (
    <Badge className={cn("border text-[9px] uppercase font-bold px-2 py-0.5", colorClass, className)}>
      {status}
    </Badge>
  );
}
