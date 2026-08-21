import { Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  paidAt?: string;
  stripePaymentIntentId?: string;
}

@Injectable()
export class PaymentsRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  create(tenantId: string, input: CreatePaymentInput) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.payment.create({
        data: {
          ...input,
          tenantId,
          paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
        },
      }),
    );
  }

  findAll(tenantId: string, invoiceId?: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.payment.findMany({
        where: { tenantId, ...(invoiceId ? { invoiceId } : {}) },
        orderBy: { paidAt: 'desc' },
      }),
    );
  }

  findByStripePaymentIntentId(tenantId: string, stripePaymentIntentId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.payment.findFirst({ where: { tenantId, stripePaymentIntentId } }),
    );
  }

  async sumByInvoice(
    tenantId: string,
    invoiceId: string,
  ): Promise<Prisma.Decimal> {
    const result = await this.tenantDb.run(tenantId, (tx) =>
      tx.payment.aggregate({
        where: { tenantId, invoiceId },
        _sum: { amount: true },
      }),
    );
    return result._sum.amount ?? new Prisma.Decimal(0);
  }
}
