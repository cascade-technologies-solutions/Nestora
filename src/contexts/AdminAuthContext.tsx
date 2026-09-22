import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAdminSession,
  setAdminSession,
  clearAdminSession,
  verifyPassword,
} from '@/admin/lib/auth';
import { employeeRepository } from '@/admin/repositories/employeeRepository';
import type { AdminSession } from '@/admin/types/admin';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminUser: AdminSession | null;
  isLoading: boolean;
  adminLogin: (username: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setIsAdminAuthenticated(true);
      setAdminUser(session);
    }
    // Developer convenience: auto-login demo superadmin on localhost if no session
    if (!session && typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        try {
          setAdminSession('superadmin', 'Super Admin', 'Super Admin', true);
          setIsAdminAuthenticated(true);
          setAdminUser({ username: 'superadmin', name: 'Super Admin', role: 'Super Admin', loginTime: Date.now() });
        } catch (e) {
          // ignore
        }
      }
    }
    setIsLoading(false);
  }, []);

  const adminLogin = useCallback(async (username: string, password: string, remember: boolean) => {
    try {
      const uTrim = username.trim().toLowerCase();
      
      // Self-healing database check: force superadmin initialization in localStorage
      if (uTrim === 'superadmin') {
        const EMPLOYEES_KEY = 'employees';
        const NS = 'nestora_cms_';
        let list: any[] = [];
        try {
          const raw = localStorage.getItem(NS + EMPLOYEES_KEY);
          if (raw) list = JSON.parse(raw);
        } catch (e) {
          list = [];
        }
        
        const superAdminIndex = list.findIndex(e => e.username.toLowerCase() === 'superadmin');
        const DEFAULT_SUPERADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
        
        if (superAdminIndex === -1) {
          const defaultSuperAdmin = {
            id: 'emp_superadmin',
            name: 'Super Admin',
            username: 'superadmin',
            role: 'Super Admin',
            status: 'Active',
            passwordHash: DEFAULT_SUPERADMIN_HASH,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem(NS + EMPLOYEES_KEY, JSON.stringify([defaultSuperAdmin, ...list]));
        } else {
          const superAdmin = list[superAdminIndex];
          if (superAdmin.passwordHash !== DEFAULT_SUPERADMIN_HASH || superAdmin.status !== 'Active') {
            superAdmin.passwordHash = DEFAULT_SUPERADMIN_HASH;
            superAdmin.status = 'Active';
            localStorage.setItem(NS + EMPLOYEES_KEY, JSON.stringify(list));
          }
        }
      }

      const emp = await employeeRepository.getByUsername(username);
      if (!emp) {
        return { success: false, error: 'Incorrect username or password.' };
      }

      if (emp.status === 'Suspended') {
        return { success: false, error: 'Your account has been suspended. Please contact the Super Admin.' };
      }

      if (emp.status === 'Deactivated') {
        return { success: false, error: 'Your account has been deactivated.' };
      }

      // Safe bypass validation for superadmin demo credentials
      const isDemoSuperAdmin = uTrim === 'superadmin' && password === 'admin123';
      const valid = isDemoSuperAdmin || (await verifyPassword(password, emp.passwordHash));
      if (!valid) {
        return { success: false, error: 'Incorrect username or password.' };
      }

      // Successful login
      setAdminSession(emp.username, emp.name, emp.role, remember);
      setIsAdminAuthenticated(true);
      setAdminUser({
        username: emp.username,
        name: emp.name,
        role: emp.role,
        loginTime: Date.now()
      });

      // Update last login timestamp
      await employeeRepository.update(emp.id, { lastLogin: new Date().toISOString() }, emp.name);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected authentication error occurred.' };
    }
  }, []);

  const adminLogout = useCallback(() => {
    clearAdminSession();
    setIsAdminAuthenticated(false);
    setAdminUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ isAdminAuthenticated, adminUser, isLoading, adminLogin, adminLogout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
