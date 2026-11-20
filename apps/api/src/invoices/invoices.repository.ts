import { Injectable } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { pageArgs } from '../common/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { itemRows, itemsTotal, newPublicToken } from './invoice-items';

const INVOICE_INCLUDE = {
  payments: { orderBy: { paidAt: 'desc' } },
  items: { orderBy: { position: 'asc' } },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantDb: TenantPrismaService,
  ) {}

  /** System-level (cron): flips every tenant's open invoices past their due date to OVERDUE. */
  markOverdue(cutoff: Date) {
    return this.prisma.invoice.updateMany({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] },
        dueDate: { lt: cutoff },
      },
      data: { status: InvoiceStatus.OVERDUE },
    });
  }

  /**
   * `monthlyLimit`, when given, checks and creates in the same transaction so a
   * FREE-plan tenant can't slip past the limit via two concurrent requests
   * racing the count. Returns null if the limit is already reached.
   *
   * The invoice number is the tenant's highest number + 1. Two concurrent
   * creates can compute the same number; the (tenantId, number) unique index
   * rejects the loser, which is retried with a fresh number.
   */
  async create(tenantId: string, dto: CreateInvoiceDto, monthlyLimit?: number) {
    const { items, totalAmount, dueDate, ...rest } = dto;
    const total = items?.length ? itemsTotal(items) : totalAmount!;

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.tenantDb.run(tenantId, async (tx) => {
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
          const last = await tx.invoice.aggregate({
            where: { tenantId },
            _max: { number: true },
          });
          return tx.invoice.create({
            data: {
              ...rest,
              tenantId,
              number: (last._max.number ?? 0) + 1,
              publicToken: newPublicToken(),
              totalAmount: total,
              dueDate: dueDate ? new Date(dueDate) : undefined,
              ...(items?.length
                ? { items: { create: itemRows(tenantId, items) } }
                : {}),
            },
            include: INVOICE_INCLUDE,
          });
        });
      } catch (error) {
        const isNumberClash =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 3;
        if (!isNumberClash) throw error;
      }
    }
  }

  findAll(tenantId: string, query: ListInvoicesQueryDto = {}) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.findMany({
        where: {
          tenantId,
          ...(query.status ? { status: query.status } : {}),
          ...(query.clientId ? { clientId: query.clientId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        ...pageArgs(query),
        include: { payments: { select: { amount: true } } },
      }),
    );
  }

  findAllForExport(
    tenantId: string,
    query: ListInvoicesQueryDto,
    limit: number,
  ) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.findMany({
        where: {
          tenantId,
          ...(query.status ? { status: query.status } : {}),
          ...(query.clientId ? { clientId: query.clientId } : {}),
        },
        orderBy: { number: 'asc' },
        take: limit,
        include: { payments: { select: { amount: true } } },
      }),
    );
  }

  findOne(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.findFirst({
        where: { id, tenantId },
        include: INVOICE_INCLUDE,
      }),
    );
  }

  update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const { items, dueDate, ...rest } = dto;
    return this.tenantDb.run(tenantId, async (tx) => {
      if (items?.length) {
        await tx.invoiceItem.deleteMany({ where: { tenantId, invoiceId: id } });
      }
      return tx.invoice.update({
        where: { id },
        data: {
          ...rest,
          ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
          ...(items?.length
            ? {
                totalAmount: itemsTotal(items),
                items: { create: itemRows(tenantId, items) },
              }
            : {}),
        },
        include: INVOICE_INCLUDE,
      });
    });
  }

  markSent(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.SENT, sentAt: new Date() },
        include: INVOICE_INCLUDE,
      }),
    );
  }

  /** System-level: the public payment page has no tenant context until the token resolves it. */
  findByPublicToken(publicToken: string) {
    return this.prisma.invoice.findUnique({
      where: { publicToken },
      include: {
        ...INVOICE_INCLUDE,
        client: { select: { name: true } },
        tenant: { select: { name: true, stripeOnboarded: true } },
      },
    });
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
