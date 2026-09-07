import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    action: string,
    entity: string,
    entityId: string,
    oldData?: any,
    newData?: any,
    userId?: string,
    tenantId?: string,
    ipAddress?: string,
  ) {
    let tId = tenantId || 'default-tenant';
    let uId = userId;

    if (!uId || uId === 'default-user') {
      const fallbackUser = await this.prisma.user.findFirst();
      uId = fallbackUser?.id || 'unknown';
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: tId,
          userId: uId,
          action,
          entity,
          entityId,
          oldData: oldData ?? {},
          newData: newData ?? {},
          ipAddress: ipAddress ?? '127.0.0.1',
        },
      });
    } catch (e) {
      console.error('AuditLog Error:', e);
    }
  }

  async getLogs(tenantId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
