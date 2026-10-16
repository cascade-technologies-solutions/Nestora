import { api } from '@/lib/api';
import type { ActivityLog } from '../types/admin';

type LogInput = Omit<ActivityLog, 'id' | 'timestamp'>;

export async function logActivity(input: LogInput): Promise<void> {
  // Backend controllers automatically record audit logs in PostgreSQL on mutations.
  return Promise.resolve();
}

export async function getRecentActivity(limit = 10): Promise<ActivityLog[]> {
  try {
    const res = await api.get(`/admin/audit-logs?limit=${limit}`);
    const items: any[] = Array.isArray(res) ? res : res.data || [];
    return items.map((item) => ({
      id: item.id,
      user: item.employee?.name || (item.employeeId === 'system' ? 'System' : item.employeeId) || 'Staff',
      action: item.action,
      module: item.module,
      timestamp: item.timestamp,
    }));
  } catch {
    return [];
  }
}
