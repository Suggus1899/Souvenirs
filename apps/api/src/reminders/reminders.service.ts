import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderChannel, ReminderRelatedType } from '@prisma/client';
import { EmailService } from '../notifications/email.service';
import { PushService } from '../notifications/push.service';
import { UsersRepository } from '../users/users.repository';
import { RemindersRepository } from './reminders.repository';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly pushService: PushService,
    private readonly emailService: EmailService,
  ) {}

  findAll(tenantId: string) {
    return this.remindersRepository.findAll(tenantId);
  }

  /** Schedules both a push and an email reminder for an invoice's due date. */
  async createForInvoiceDueDate(
    tenantId: string,
    invoiceId: string,
    dueDate: Date,
    message: string,
  ) {
    await Promise.all([
      this.remindersRepository.create(tenantId, {
        relatedType: ReminderRelatedType.INVOICE,
        relatedId: invoiceId,
        remindAt: dueDate,
        channel: ReminderChannel.PUSH,
        message,
      }),
      this.remindersRepository.create(tenantId, {
        relatedType: ReminderRelatedType.INVOICE,
        relatedId: invoiceId,
        remindAt: dueDate,
        channel: ReminderChannel.EMAIL,
        message,
      }),
    ]);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async dispatchDue() {
    const dueReminders = await this.remindersRepository.findDuePending(
      new Date(),
    );
    for (const reminder of dueReminders) {
      try {
        await this.dispatchOne(
          reminder.tenantId,
          reminder.channel,
          reminder.message,
        );
        await this.remindersRepository.markSent(reminder.id);
      } catch (error) {
        this.logger.error(`Failed to dispatch reminder ${reminder.id}`, error);
      }
    }
  }

  private async dispatchOne(
    tenantId: string,
    channel: ReminderChannel,
    message: string,
  ) {
    const owners =
      await this.usersRepository.findOwnersWithPushTokens(tenantId);

    if (channel === ReminderChannel.PUSH) {
      const tokens = owners.flatMap((owner) =>
        owner.pushTokens.map((t) => t.token),
      );
      await this.pushService.sendToTokens(tokens, 'Payment reminder', message);
      return;
    }

    for (const owner of owners) {
      await this.emailService.send(owner.email, 'Payment reminder', message);
    }
  }
}
