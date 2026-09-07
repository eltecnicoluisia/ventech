import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PosService } from './pos.service';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('sale')
  async createSale(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user ?? { id: 'user-demo', tenantId: 'tenant-demo' };

    return await this.posService.createSale(
      user.tenantId,
      user.id,
      body.customerId ?? null,
      body.items ?? [],
      body.payments ?? [],
    );
  }
}
