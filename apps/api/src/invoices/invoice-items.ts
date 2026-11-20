import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { InvoiceItemDto } from './dto/invoice-item.dto';

/** Sum of quantity × unit price, in exact decimal arithmetic. */
export function itemsTotal(items: InvoiceItemDto[]): Prisma.Decimal {
  return items.reduce(
    (sum, item) =>
      sum.plus(new Prisma.Decimal(item.unitPrice).times(item.quantity)),
    new Prisma.Decimal(0),
  );
}

export function itemRows(tenantId: string, items: InvoiceItemDto[]) {
  return items.map((item, position) => ({
    tenantId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    position,
  }));
}

/** 192 bits of randomness, URL-safe: the only secret guarding the public payment page. */
export function newPublicToken(): string {
  return randomBytes(24).toString('base64url');
}
