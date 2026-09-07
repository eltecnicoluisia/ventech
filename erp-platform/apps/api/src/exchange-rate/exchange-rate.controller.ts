import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';

@Controller('exchange')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get('bcv')
  async getBcvRate() {
    return this.exchangeRateService.getBcvRate();
  }

  @Get('history')
  async getHistory(@Query('limit') limit?: string) {
    return this.exchangeRateService.getRateHistory(limit ? Number(limit) : 48);
  }
}
