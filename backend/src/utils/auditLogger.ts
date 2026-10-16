import { prisma } from './prisma';

export type AuditModule =
  | 'Properties'
  | 'Projects'
  | 'Services'
  | 'Employees'
  | 'Website CMS'
  | 'Enquiries'
  | 'Media Library'
  | 'Settings';

export interface AuditLogOptions {
  employeeId?: string;
  action: string;
  module: AuditModule;
}

export async function logAudit(
  employeeIdOrOptions: string | AuditLogOptions,
  action?: string,
  module?: AuditModule
): Promise<void> {
  try {
    let empId = 'system';
    let act = '';
    let mod: AuditModule = 'Settings';

    if (typeof employeeIdOrOptions === 'object' && employeeIdOrOptions !== null) {
      empId = employeeIdOrOptions.employeeId || 'system';
      act = employeeIdOrOptions.action;
      mod = employeeIdOrOptions.module;
    } else {
      empId = employeeIdOrOptions || 'system';
      act = action || '';
      mod = module || 'Settings';
    }

    await prisma.auditLog.create({
      data: {
        employeeId: empId,
        action: act,
        module: mod,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
