import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';

interface CurrencyTotal {
  currency: string;
  amount: Prisma.Decimal;
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  /** All aggregates in one RLS-scoped transaction; money is grouped by currency, never mixed. */
  summary(tenantId: string, monthStart: Date, now: Date, weekEnd: Date) {
    return this.tenantDb.run(tenantId, async (tx) => {
      const collected = await tx.$queryRaw<CurrencyTotal[]>`
        SELECT i."currency", SUM(p."amount") AS amount
        FROM "payments" p JOIN "invoices" i ON i."id" = p."invoiceId"
        WHERE p."tenantId" = ${tenantId} AND p."paidAt" >= ${monthStart}
        GROUP BY i."currency" ORDER BY i."currency"`;

      const outstanding = await tx.$queryRaw<CurrencyTotal[]>`
        SELECT i."currency",
               SUM(i."totalAmount" - COALESCE(paid.total, 0)) AS amount
        FROM "invoices" i
        LEFT JOIN (
          SELECT "invoiceId", SUM("amount") AS total FROM "payments"
          WHERE "tenantId" = ${tenantId} GROUP BY "invoiceId"
        ) paid ON paid."invoiceId" = i."id"
        WHERE i."tenantId" = ${tenantId}
          AND i."status" IN ('SENT', 'PARTIAL', 'OVERDUE')
        GROUP BY i."currency" ORDER BY i."currency"`;

      const [openInvoices, overdueInvoices, bookingsThisWeek, nextBookings] =
        await Promise.all([
          tx.invoice.count({
            where: { tenantId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
          }),
          tx.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
          tx.booking.count({
            where: {
              tenantId,
              status: { not: 'CANCELLED' },
              scheduledAt: { gte: now, lt: weekEnd },
            },
          }),
          tx.booking.findMany({
            where: {
              tenantId,
              status: { notIn: ['CANCELLED', 'COMPLETED'] },
              scheduledAt: { gte: now },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              status: true,
              client: { select: { name: true } },
            },
          }),
        ]);

      return {
        collected,
        outstanding,
        openInvoices,
        overdueInvoices,
        bookingsThisWeek,
        nextBookings,
      };
    });
  }
}
