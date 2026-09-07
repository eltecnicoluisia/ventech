import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MulticurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveRate(tenantId: string, currency: string = 'VES') {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { tenantId, currency, active: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!rate) {
      throw new BadRequestException(
        `No hay tasa de cambio activa para ${currency}. Configure la tasa BCV primero.`,
      );
    }
    return rate;
  }

  async updateRate(
    tenantId: string,
    currency: string,
    newRate: number,
    source: string = 'BCV',
  ) {
    await this.prisma.exchangeRate.updateMany({
      where: { tenantId, currency, active: true },
      data: { active: false },
    });

    return this.prisma.exchangeRate.create({
      data: { tenantId, currency, rate: newRate, source, active: true },
    });
  }
}
