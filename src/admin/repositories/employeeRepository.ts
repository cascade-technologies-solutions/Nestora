import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { Employee, EmployeeStatus, EmployeeRoleType } from '../types/admin';

export const employeeRepository = {
  async getAll(): Promise<Employee[]> {
    try {
      const res = await api.get('/admin/employees');
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Employee | null> {
    const list = await this.getAll();
    return list.find((e) => e.id === id) ?? null;
  },

  async getByUsername(username: string): Promise<Employee | null> {
    const list = await this.getAll();
    return list.find((e) => e.username.toLowerCase() === username.toLowerCase()) ?? null;
  },

  async create(name: string, username: string, passwordHash: string, role: EmployeeRoleType, activeUser: string): Promise<Employee> {
    const res = await api.post('/admin/employees', {
      name,
      username,
      password: 'TemporaryEmployeePassword123!',
      role,
    });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    return res.data ?? res;
  },

  async update(id: string, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'role'>>, activeUser: string): Promise<Employee> {
    const res = await api.put(`/admin/employees/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    return res.data ?? res;
  },

  async updateStatus(id: string, status: EmployeeStatus, activeUser: string): Promise<Employee> {
    const res = await api.patch(`/admin/employees/${id}/status`, { status });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    return res.data ?? res;
  },
};
