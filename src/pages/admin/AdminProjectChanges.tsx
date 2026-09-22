import { useEffect, useState } from 'react';
import { getRecentActivity } from '@/admin/repositories/activityRepository';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const AdminProjectChanges = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { adminUser } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const all = await getRecentActivity(50);
      const projectsOnly = all.filter(l => l.module === 'Projects');
      setLogs(projectsOnly);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Project Change Log</h1>
          <p className="text-slate-500 text-xs mt-1">Recent actions related to Projects by admins.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/admin/projects')}>Back to Projects</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : logs.length === 0 ? (
        <Card className="p-6 text-slate-400">No recent project activity found.</Card>
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <Card key={l.id} className="p-4 flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-300 font-semibold">{l.action}</div>
                <div className="text-xs text-slate-500 mt-1">By {l.user}</div>
              </div>
              <div className="text-xs text-slate-500">{format(new Date(l.timestamp), 'dd/MM/yyyy HH:mm')}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjectChanges;
