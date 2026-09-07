import { Controller, Get, Post, Patch, Body, Param, Headers } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  private tid(h: string) { return h || 'default-tenant'; }

  @Post()
  createSale(@Headers('x-tenant-id') t: string, @Body() dto: any) {
    return this.salesService.createSale(this.tid(t), dto);
  }

  @Get()
  getSales(@Headers('x-tenant-id') t: string) {
    return this.salesService.getSales(this.tid(t));
  }

  @Get(':id')
  getSaleById(@Headers('x-tenant-id') t: string, @Param('id') id: string) {
    return this.salesService.getSaleById(this.tid(t), id);
  }

  @Patch(':id/cancel')
  cancelSale(@Headers('x-tenant-id') t: string, @Param('id') id: string) {
    return this.salesService.cancelSale(this.tid(t), id);
  }
}
