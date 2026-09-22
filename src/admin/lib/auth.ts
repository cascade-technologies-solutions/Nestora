import type { AdminSession } from '../types/admin';

const SESSION_KEY = 'nestora_admin_session';
const PERSISTENT_SESSION_KEY = 'nestora_admin_session_persistent';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

export function getAdminSession(): AdminSession | null {
  try {
    let raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      raw = localStorage.getItem(PERSISTENT_SESSION_KEY);
    }
    if (!raw) return null;
    
    const session = JSON.parse(raw) as AdminSession;
    // Session expires after 7 days if persistent, or 8 hours if temporary
    const isPersistent = localStorage.getItem(PERSISTENT_SESSION_KEY) === raw;
    const expiry = isPersistent ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    
    if (Date.now() - session.loginTime > expiry) {
      clearAdminSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(username: string, name: string, role: AdminSession['role'], remember: boolean): void {
  const session: AdminSession = {
    username,
    name,
    role,
    loginTime: Date.now(),
  };
  const stringified = JSON.stringify(session);
  if (remember) {
    localStorage.setItem(PERSISTENT_SESSION_KEY, stringified);
  } else {
    sessionStorage.setItem(SESSION_KEY, stringified);
  }
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PERSISTENT_SESSION_KEY);
}
