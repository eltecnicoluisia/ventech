import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('license')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLicense(@Headers('x-tenant-id') t: string) {
    const tenantId = t || 'default-tenant';
    let tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      tenant = await this.prisma.tenant.create({ data: { id: tenantId, name: 'Default Tenant' } });
    }
    return { expiresAt: tenant.licenseExpiresAt };
  }

  @Post()
  async setLicense(@Headers('x-tenant-id') t: string, @Body() body: { expiresAt: string | null }) {
    const tenantId = t || 'default-tenant';
    const expiresDate = body.expiresAt ? new Date(body.expiresAt) : null;
    await this.prisma.tenant.upsert({
      where: { id: tenantId },
      create: { id: tenantId, name: 'Default Tenant', licenseExpiresAt: expiresDate },
      update: { licenseExpiresAt: expiresDate }
    });
    return { success: true };
  }
}
