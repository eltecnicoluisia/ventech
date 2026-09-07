import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ─── Generar número de factura correlativo ────────────────────────────────
  private async nextInvoiceNumber(tenantId: string): Promise<string> {
    const last = await this.prisma.sale.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });
    if (!last) return 'INV-00001';
    const num = parseInt(last.invoiceNumber.replace('INV-', ''), 10) || 0;
    return 'INV-' + String(num + 1).padStart(5, '0');
  }

  // ─── Crear venta ──────────────────────────────────────────────────────────
  async createSale(tenantId: string, dto: any) {
    const {
      items,           // [{variantId, name, price, quantity, unit, code}]
      paymentMethod,   // CASH | CARD | TRANSFER
      paymentCurrency, // USD | VES
      exchangeRate,
      subtotalUSD,
      taxUSD,
      igtfUSD,
      totalUSD,
      totalVES,
    } = dto;

    const invoiceNumber = await this.nextInvoiceNumber(tenantId);

    // Crear venta + ítems + descontar stock en una transacción
    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          tenantId,
          invoiceNumber,
          subtotalUSD: Number(subtotalUSD),
          taxUSD: Number(taxUSD),
          igtfUSD: Number(igtfUSD),
          totalUSD: Number(totalUSD),
          totalVES: Number(totalVES),
          exchangeRate: Number(exchangeRate),
          paymentMethod,
          paymentCurrency,
          status: 'COMPLETED',
          items: {
            create: items.map((item: any) => ({
              productId: item.variantId || null,
              code: item.code || null,
              name: item.name,
              unit: item.unit || 'Unidad',
              quantity: Number(item.quantity),
              priceUSD: Number(item.price),
              subtotal: Number(item.price) * Number(item.quantity),
            })),
          },
        },
        include: { items: true },
      });

      // Descontar stock por cada item vendido
      for (const item of items) {
        if (item.variantId) {
          const product = await tx.product.findUnique({ where: { id: item.variantId } });
          if (product) {
            const qty = Number(item.quantity);
            if (qty > Number(product.stock)) {
              throw new BadRequestException(`Stock insuficiente para el producto: ${product.name}. Stock actual: ${Number(product.stock)}`);
            }
            const newStock = Number(product.stock) - qty;
            await tx.product.update({
              where: { id: item.variantId },
              data: {
                stock: newStock,
                status: newStock <= 0 ? 'AGOTADO' : product.status,
              },
            });
          }
        }
      }

      return created;
    });

    await this.audit.logAction('CREATE_SALE', 'Sale', sale.id, undefined, sale, undefined, tenantId);

    return sale;
  }

  // ─── Listar historial de ventas ───────────────────────────────────────────
  async getSales(tenantId: string) {
    return this.prisma.sale.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Ver detalle de una venta ─────────────────────────────────────────────
  async getSaleById(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  // ─── Cancelar venta (restaura stock) ─────────────────────────────────────
  async cancelSale(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status === 'CANCELLED') throw new BadRequestException('La venta ya está cancelada');

    await this.prisma.$transaction(async (tx) => {
      await tx.sale.update({ where: { id }, data: { status: 'CANCELLED' } });
      for (const item of sale.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: Number(product.stock) + Number(item.quantity),
                status: 'ACTIVO',
              },
            });
          }
        }
      }
    });

    await this.audit.logAction('CANCEL_SALE', 'Sale', sale.id, sale, { ...sale, status: 'CANCELLED' }, undefined, tenantId);

    return { ok: true, message: 'Venta cancelada y stock restaurado' };
  }
}
