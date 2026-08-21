import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  create(tenantId: string, dto: CreateInvoiceDto) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.create({
        data: {
          ...dto,
          tenantId,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
      }),
    );
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
