import { storageGet, storageSet, storageHas } from '../lib/storage';
import type { Employee, EmployeeStatus, EmployeeRoleType } from '../types/admin';
import { logActivity } from './activityRepository';

const EMPLOYEES_KEY = 'employees';

// SHA-256 of 'admin123'
const DEFAULT_SUPERADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

function seedEmployeesIfNeeded() {
  let list = storageGet<Employee[]>(EMPLOYEES_KEY) ?? [];
  const superAdminIndex = list.findIndex(e => e.username.toLowerCase() === 'superadmin');

  if (superAdminIndex === -1) {
    const defaultSuperAdmin: Employee = {
      id: 'emp_superadmin',
      name: 'Super Admin',
      username: 'superadmin',
      role: 'Super Admin',
      status: 'Active',
      passwordHash: DEFAULT_SUPERADMIN_HASH,
      createdAt: new Date().toISOString()
    };
    storageSet<Employee[]>(EMPLOYEES_KEY, [defaultSuperAdmin, ...list]);
  } else {
    const superAdmin = list[superAdminIndex];
    if (superAdmin.passwordHash !== DEFAULT_SUPERADMIN_HASH || superAdmin.status !== 'Active') {
      superAdmin.passwordHash = DEFAULT_SUPERADMIN_HASH;
      superAdmin.status = 'Active';
      storageSet<Employee[]>(EMPLOYEES_KEY, list);
    }
  }
}

export const employeeRepository = {
  async getAll(): Promise<Employee[]> {
    seedEmployeesIfNeeded();
    return Promise.resolve(storageGet<Employee[]>(EMPLOYEES_KEY) ?? []);
  },

  async getById(id: string): Promise<Employee | null> {
    const list = await this.getAll();
    return Promise.resolve(list.find(e => e.id === id) ?? null);
  },

  async getByUsername(username: string): Promise<Employee | null> {
    const list = await this.getAll();
    return Promise.resolve(list.find(e => e.username.toLowerCase() === username.toLowerCase()) ?? null);
  },

  async create(name: string, username: string, passwordHash: string, role: EmployeeRoleType, activeUser: string): Promise<Employee> {
    seedEmployeesIfNeeded();
    const list = await this.getAll();

    // Validate maximum admins
    if (role === 'Admin') {
      const adminCount = list.filter(e => e.role === 'Admin' && e.status !== 'Deactivated').length;
      if (adminCount >= 2) {
        throw new Error('Maximum limit of 2 active/suspended Admin accounts has been reached.');
      }
    }

    // Validate unique username
    if (list.some(e => e.username.toLowerCase() === username.toLowerCase())) {
      throw new Error(`Username "${username}" is already taken.`);
    }

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name,
      username,
      role,
      status: 'Active',
      passwordHash,
      createdAt: new Date().toISOString()
    };

    storageSet<Employee[]>(EMPLOYEES_KEY, [...list, newEmp]);
    await logActivity({
      user: activeUser,
      action: `created Employee ${name} (${role})`,
      module: 'Employees'
    });

    return Promise.resolve(newEmp);
  },

  async update(id: string, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'role'>>, activeUser: string): Promise<Employee> {
    const list = await this.getAll();
    const index = list.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employee record not found.');

    const current = list[index];

    // Validate unique username if changed
    if (data.username && data.username.toLowerCase() !== current.username.toLowerCase()) {
      if (list.some(e => e.username.toLowerCase() === data.username!.toLowerCase())) {
        throw new Error(`Username "${data.username}" is already taken.`);
      }
    }

    // Enforce exactly one Super Admin rules
    if (current.role === 'Super Admin' && data.status && data.status !== 'Active') {
      throw new Error('The Super Admin account status cannot be changed.');
    }

    const updated: Employee = {
      ...current,
      ...data,
      id
    };

    list[index] = updated;
    storageSet<Employee[]>(EMPLOYEES_KEY, list);
    
    await logActivity({
      user: activeUser,
      action: `updated Employee record of ${updated.name}`,
      module: 'Employees'
    });

    return Promise.resolve(updated);
  },

  async updateStatus(id: string, status: EmployeeStatus, activeUser: string): Promise<Employee> {
    const list = await this.getAll();
    const emp = list.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found');

    if (emp.role === 'Super Admin') {
      throw new Error('Super Admin cannot be suspended or deactivated.');
    }

    // If we are reactivating (Active or Suspended) and the role is Admin, check count
    if (emp.role === 'Admin' && status !== 'Deactivated') {
      const activeAdminCount = list.filter(e => e.role === 'Admin' && e.status !== 'Deactivated' && e.id !== id).length;
      if (activeAdminCount >= 2) {
        throw new Error('Cannot activate Admin. Maximum limit of 2 active/suspended Admin accounts is already reached.');
      }
    }

    const updated = await this.update(id, { status }, activeUser);

    let actionWord = 'updated status to ' + status;
    if (status === 'Suspended') actionWord = 'suspended Admin account of ' + emp.name;
    if (status === 'Active') actionWord = 'activated Admin account of ' + emp.name;
    if (status === 'Deactivated') actionWord = 'deactivated Admin account of ' + emp.name;

    await logActivity({
      user: activeUser,
      action: actionWord,
      module: 'Employees'
    });

    return updated;
  }
};
