import { Injectable } from '@nestjs/common';
import {
  InvoiceStatus,
  ReminderChannel,
  ReminderRelatedType,
  ReminderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';

interface CreateReminderInput {
  relatedType: ReminderRelatedType;
  relatedId: string;
  remindAt: Date;
  channel: ReminderChannel;
  message: string;
}

@Injectable()
export class RemindersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantDb: TenantPrismaService,
  ) {}

  create(tenantId: string, input: CreateReminderInput) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.reminder.create({ data: { ...input, tenantId } }),
    );
  }

  findAll(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.reminder.findMany({
        where: { tenantId },
        orderBy: { remindAt: 'asc' },
      }),
    );
  }

  /** Stops every still-pending reminder about one booking/invoice (it was paid, cancelled, rescheduled...). */
  dismissPendingFor(
    tenantId: string,
    relatedType: ReminderRelatedType,
    relatedId: string,
  ) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.reminder.updateMany({
        where: {
          tenantId,
          relatedType,
          relatedId,
          status: ReminderStatus.PENDING,
        },
        data: { status: ReminderStatus.DISMISSED },
      }),
    );
  }

  /** System-level: scans reminders across every tenant, so it stays on the owner connection (no single tenant context applies). */
  findDuePending(now: Date) {
    return this.prisma.reminder.findMany({
      where: { status: ReminderStatus.PENDING, remindAt: { lte: now } },
    });
  }

  /** System-level: ids of the given invoices that no longer need a payment reminder. */
  async findClosedInvoiceIds(invoiceIds: string[]): Promise<Set<string>> {
    if (invoiceIds.length === 0) return new Set();
    const closed = await this.prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
      },
      select: { id: true },
    });
    return new Set(closed.map((i) => i.id));
  }

  /**
   * Atomically moves a reminder out of PENDING. Only the caller whose update
   * matched the row "owns" it, so two API instances running the cron at once
   * can never both send the same reminder.
   */
  async claim(id: string, status: ReminderStatus): Promise<boolean> {
    const { count } = await this.prisma.reminder.updateMany({
      where: { id, status: ReminderStatus.PENDING },
      data: { status },
    });
    return count === 1;
  }

  /** Puts a claimed reminder back in the queue after a failed send, so the next run retries it. */
  release(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.PENDING },
    });
  }
}
