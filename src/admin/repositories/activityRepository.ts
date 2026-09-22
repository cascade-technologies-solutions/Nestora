// ─── Activity Log Repository ──────────────────────────────────────────────────
// Stores the last 50 admin actions for the Dashboard recent activity feed.

import { storageGet, storageSet } from '../lib/storage';
import type { ActivityLog } from '../types/admin';

const ACTIVITY_KEY = 'activity_log';
const MAX_LOGS = 50;

type LogInput = Omit<ActivityLog, 'id' | 'timestamp'>;

export async function logActivity(input: LogInput): Promise<void> {
  const existing = storageGet<ActivityLog[]>(ACTIVITY_KEY) ?? [];
  const entry: ActivityLog = {
    ...input,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...existing].slice(0, MAX_LOGS);
  storageSet<ActivityLog[]>(ACTIVITY_KEY, updated);
  return Promise.resolve();
}

export async function getRecentActivity(limit = 10): Promise<ActivityLog[]> {
  const logs = storageGet<ActivityLog[]>(ACTIVITY_KEY) ?? [];
  return Promise.resolve(logs.slice(0, limit));
}
