import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MulticurrencyService } from '../multicurrency/multicurrency.service';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private currencyService: MulticurrencyService,
  ) {}

  async createSale(
    tenantId: string,
    userId: string,
    customerId: string | null,
    items: Array<{
      variantId: string;
      quantity: number;
      serialNumbers?: string[];
    }>,
    payments: Array<{
      method: string;
      currency: string;
      amount: number;
      reference?: string;
    }>,
  ) {
    const activeRate = await this.currencyService.getActiveRate(tenantId, 'VES');
    const rateValue = Number(activeRate.rate);

    return await this.prisma.$transaction(async (tx) => {
      let totalBase = 0;
      let totalTax = 0;
      let totalIGTF = 0;

      const orderItemsData: Array<{
        variantId: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        subtotal: number;
      }> = [];

      for (const item of items) {
        const variant = await tx.variant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) throw new BadRequestException(`Variante ${item.variantId} no encontrada`);
        if (Number(variant.stock) < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para: ${variant.name}`);
        }

        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: Number(variant.stock) - item.quantity },
        });

        if (item.serialNumbers && item.serialNumbers.length > 0) {
          if (item.serialNumbers.length !== item.quantity) {
            throw new BadRequestException(`Se requieren ${item.quantity} número(s) de serie`);
          }
          await tx.serialNumber.updateMany({
            where: {
              serial: { in: item.serialNumbers },
              variantId: item.variantId,
              status: 'AVAILABLE',
            },
            data: { status: 'SOLD' },
          });
        }

        const unitPrice = Number(variant.product.priceUSD) + Number(variant.priceDiff);
        const subtotal = unitPrice * item.quantity;
        const taxRate = variant.product.isExempt ? 0 : 16;
        const tax = subtotal * (taxRate / 100);

        totalBase += subtotal;
        totalTax += tax;

        orderItemsData.push({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice,
          taxRate,
          subtotal,
        });
      }

      let paidBaseTotal = 0;
      const paymentsData: Array<{
        method: any;
        currency: string;
        amount: number;
        applyIGTF: boolean;
        reference?: string;
      }> = [];

      for (const pay of payments) {
        let amountInBase = pay.amount;
        let applyIGTF = false;

        if (pay.currency === 'VES') {
          amountInBase = pay.amount / rateValue;
        } else if (['CASH', 'ZELLE', 'BINANCE'].includes(pay.method)) {
          applyIGTF = true;
          totalIGTF += pay.amount * 0.03;
        }

        paidBaseTotal += amountInBase;
        paymentsData.push({
          method: pay.method as any,
          currency: pay.currency,
          amount: pay.amount,
          applyIGTF,
          reference: pay.reference,
        });
      }

      const grandTotal = totalBase + totalTax + totalIGTF;
      const totalLocal = grandTotal * rateValue;

      if (Math.abs(grandTotal - paidBaseTotal) > 0.1) {
        throw new BadRequestException(
          `Pago insuficiente: debe ${grandTotal.toFixed(2)} USD, recibido ${paidBaseTotal.toFixed(2)} USD`,
        );
      }

      const order = await tx.order.create({
        data: {
          tenantId,
          userId,
          customerId,
          totalBase: grandTotal,
          totalTax,
          totalIGTF,
          totalLocal,
          exchangeRate: activeRate.rate,
          status: 'COMPLETED',
          items: { create: orderItemsData },
          payments: { create: paymentsData },
        },
        include: { items: true, payments: true },
      });

      return order;
    });
  }
}
