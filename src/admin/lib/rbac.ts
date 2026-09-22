import { employeeRepository } from '@/admin/repositories/employeeRepository';
import type { Employee } from '@/admin/types/admin';

async function findEmployeeByIdentifier(identifier?: string | null): Promise<Employee | null> {
  if (!identifier) return null;
  // Try username first
  const byUsername = await employeeRepository.getByUsername(identifier);
  if (byUsername) return byUsername;
  // Fallback: search by display name
  const all = await employeeRepository.getAll();
  return all.find(e => e.name.toLowerCase() === identifier.toLowerCase()) ?? null;
}

export async function requireRole(identifier: string | undefined | null, allowedRoles: Array<'Admin' | 'Super Admin'>): Promise<Employee> {
  const emp = await findEmployeeByIdentifier(identifier);
  if (!emp) throw new Error('Unauthorized: admin account not found');
  if (!allowedRoles.includes(emp.role as any)) throw new Error('Permission denied');
  return emp;
}

export async function isSuperAdmin(identifier: string | undefined | null): Promise<boolean> {
  const emp = await findEmployeeByIdentifier(identifier);
  return emp ? emp.role === 'Super Admin' : false;
}
