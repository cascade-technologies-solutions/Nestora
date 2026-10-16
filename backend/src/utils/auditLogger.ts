import { prisma } from './prisma';

export async function logAudit(
  employeeId: string,
  action: string,
  module: 'Properties' | 'Projects' | 'Services' | 'Employees' | 'Website CMS' | 'Enquiries' | 'Media Library' | 'Settings'
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        employeeId,
        action,
        module,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
