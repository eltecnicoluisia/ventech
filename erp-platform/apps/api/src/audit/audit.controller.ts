import { Controller, Get, Query, Headers } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getLogs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('limit') limit: string,
  ) {
    return this.auditService.getLogs(tenantId || 'default-tenant', parseInt(limit) || 100);
  }
}
