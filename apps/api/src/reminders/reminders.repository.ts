import { Injectable } from '@nestjs/common';
import {
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

  /** System-level: scans reminders across every tenant, so it stays on the owner connection (no single tenant context applies). */
  findDuePending(now: Date) {
    return this.prisma.reminder.findMany({
      where: { status: ReminderStatus.PENDING, remindAt: { lte: now } },
    });
  }

  markSent(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.SENT },
    });
  }
}
