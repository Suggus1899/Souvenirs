import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  /**
   * `monthlyLimit`, when given, checks and creates in the same transaction so a
   * FREE-plan tenant can't slip past the limit via two concurrent requests
   * racing the count. Returns null if the limit is already reached.
   */
  create(tenantId: string, dto: CreateInvoiceDto, monthlyLimit?: number) {
    return this.tenantDb.run(tenantId, async (tx) => {
      if (monthlyLimit !== undefined) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const countThisMonth = await tx.invoice.count({
          where: { tenantId, createdAt: { gte: startOfMonth } },
        });
        if (countThisMonth >= monthlyLimit) {
          return null;
        }
      }
      return tx.invoice.create({
        data: {
          ...dto,
          tenantId,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
      });
    });
  }

  findAll(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  findOne(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.findFirst({
        where: { id, tenantId },
        include: { payments: true },
      }),
    );
  }

  update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.update({
        where: { id },
        data: {
          ...dto,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
      }),
    );
  }

  updateStatus(tenantId: string, id: string, status: InvoiceStatus) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.update({ where: { id }, data: { status } }),
    );
  }

  setStripeCheckout(
    tenantId: string,
    id: string,
    stripeCheckoutSessionId: string,
    paymentLinkUrl: string,
  ) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.update({
        where: { id },
        data: { stripeCheckoutSessionId, paymentLinkUrl },
      }),
    );
  }
}
