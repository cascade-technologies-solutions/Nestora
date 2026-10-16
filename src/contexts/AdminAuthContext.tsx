import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAdminSession,
  setAdminSession,
  clearAdminSession,
} from '@/admin/lib/auth';
import { api, setAdminToken } from '@/lib/api';
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

  // Initialize and verify session against backend on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const cached = getAdminSession();
      if (cached) {
        setIsAdminAuthenticated(true);
        setAdminUser(cached);
      }

      try {
        // Verify session with the real backend /me endpoint
        const res = await api.get<{
          id: string;
          username: string;
          name: string;
          role: AdminSession['role'];
          permissions: string[];
        }>('/admin/auth/me', { authType: 'admin' });

        if (isMounted && res) {
          const verifiedSession: AdminSession = {
            id: res.id,
            username: res.username,
            name: res.name,
            role: res.role,
            permissions: res.permissions,
            loginTime: cached?.loginTime || Date.now(),
          };
          setIsAdminAuthenticated(true);
          setAdminUser(verifiedSession);
          // Update cached session with verified data
          setAdminSession(
            verifiedSession.username,
            verifiedSession.name,
            verifiedSession.role,
            true,
            verifiedSession.permissions,
            verifiedSession.id
          );
        }
      } catch (err) {
        // If /me failed and no cached session or token expired, clear
        if (isMounted) {
          clearAdminSession();
          setAdminToken(null);
          setIsAdminAuthenticated(false);
          setAdminUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const adminLogin = useCallback(async (username: string, password: string, remember: boolean) => {
    try {
      const uTrim = username.trim();
      if (!uTrim || !password) {
        return { success: false, error: 'Please enter both username and password.' };
      }

      // Production authentication: strictly database-backed via Express API
      const res = await api.post<{
        accessToken: string;
        user: {
          id: string;
          username: string;
          name: string;
          role: AdminSession['role'];
          permissions: string[];
          loginTime: number;
        };
      }>('/admin/auth/login', {
        username: uTrim,
        password,
        remember,
      });

      if (!res || !res.accessToken || !res.user) {
        return { success: false, error: 'Invalid response from authentication server.' };
      }

      // Store Bearer token in memory & storage
      setAdminToken(res.accessToken);

      const session: AdminSession = {
        id: res.user.id,
        username: res.user.username,
        name: res.user.name,
        role: res.user.role,
        permissions: res.user.permissions,
        loginTime: res.user.loginTime || Date.now(),
      };

      setAdminSession(session.username, session.name, session.role, remember, session.permissions, session.id);
      setIsAdminAuthenticated(true);
      setAdminUser(session);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Incorrect username or password.',
      };
    }
  }, []);

  const adminLogout = useCallback(async () => {
    try {
      await api.post('/admin/auth/logout', {}, { authType: 'admin', skipRefresh: true }).catch(() => {});
    } finally {
      clearAdminSession();
      setAdminToken(null);
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    }
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
