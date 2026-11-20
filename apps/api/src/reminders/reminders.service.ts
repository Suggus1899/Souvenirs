import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Reminder,
  ReminderChannel,
  ReminderRecipient,
  ReminderRelatedType,
  ReminderStatus,
} from '@prisma/client';
import { EmailService } from '../notifications/email.service';
import { PushService } from '../notifications/push.service';
import { UsersRepository } from '../users/users.repository';
import { addDays, duePhrase, formatDate } from './reminder-schedule';
import {
  CreateReminderInput,
  RemindersRepository,
} from './reminders.repository';

const BOOKING_REMINDER_HOURS_BEFORE = 24;

export interface InvoiceReminderContext {
  tenant: {
    name: string;
    reminderOffsetsDays: number[];
    clientRemindersEnabled: boolean;
  };
  invoice: {
    id: string;
    number: number;
    publicToken: string;
    totalAmount: { toString(): string };
    currency: string;
    dueDate: Date;
  };
  client: { name: string; email: string | null };
}

export interface BookingReminderContext {
  id: string;
  title: string;
  scheduledAt: Date;
  status: string;
  clientName: string;
}

type Owners = Awaited<ReturnType<UsersRepository['findOwnersWithPushTokens']>>;

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly pushService: PushService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  findAll(tenantId: string) {
    return this.remindersRepository.findAll(tenantId);
  }

  /**
   * Called when an invoice is sent. For each of the tenant's offsets (days relative
   * to the due date) the studio gets a push, and the client gets an email with the
   * payment link — or, if client reminders are off or the client has no email, the
   * studio gets the email on the due day itself. Reminders already in the past are skipped.
   */
  async scheduleForInvoice(tenantId: string, ctx: InvoiceReminderContext) {
    const { tenant, invoice, client } = ctx;
    const now = new Date();
    const amount = `${invoice.totalAmount.toString()} ${invoice.currency}`;
    const payUrl = `${this.configService.getOrThrow<string>('WEB_APP_URL')}/pay/${invoice.publicToken}`;
    const emailClient = tenant.clientRemindersEnabled && Boolean(client.email);

    const base = {
      relatedType: ReminderRelatedType.INVOICE,
      relatedId: invoice.id,
    };
    const reminders = [...new Set(tenant.reminderOffsetsDays)]
      .map((offset) => ({ offset, remindAt: addDays(invoice.dueDate, offset) }))
      .filter(({ remindAt }) => remindAt > now)
      .flatMap(({ offset, remindAt }) => {
        const phrase = duePhrase(offset);
        const out: CreateReminderInput[] = [
          {
            ...base,
            remindAt,
            channel: ReminderChannel.PUSH,
            recipient: ReminderRecipient.OWNER,
            message: `La factura #${invoice.number} de ${client.name} (${amount}) ${phrase}.`,
          },
        ];
        if (emailClient) {
          out.push({
            ...base,
            remindAt,
            channel: ReminderChannel.EMAIL,
            recipient: ReminderRecipient.CLIENT,
            recipientEmail: client.email!,
            message:
              `Hola ${client.name}, te recordamos que la factura #${invoice.number} de ${tenant.name} ` +
              `por ${amount} ${phrase} (${formatDate(invoice.dueDate)}).\n\n` +
              `Puedes ver el detalle y pagar aquí: ${payUrl}`,
          });
        } else if (offset === 0) {
          out.push({
            ...base,
            remindAt,
            channel: ReminderChannel.EMAIL,
            recipient: ReminderRecipient.OWNER,
            message: `La factura #${invoice.number} de ${client.name} por ${amount} vence hoy.`,
          });
        }
        return out;
      });

    await this.remindersRepository.createMany(tenantId, reminders);
  }

  dismissForInvoice(tenantId: string, invoiceId: string) {
    return this.remindersRepository.dismissPendingFor(
      tenantId,
      ReminderRelatedType.INVOICE,
      invoiceId,
    );
  }

  /** (Re)schedules the studio's push reminder the day before a booking. Idempotent per booking. */
  async scheduleForBooking(tenantId: string, booking: BookingReminderContext) {
    await this.dismissForBooking(tenantId, booking.id);
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return;
    }
    const remindAt = new Date(
      booking.scheduledAt.getTime() -
        BOOKING_REMINDER_HOURS_BEFORE * 60 * 60 * 1000,
    );
    if (remindAt <= new Date()) return;

    const when = booking.scheduledAt.toLocaleString('es-VE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    await this.remindersRepository.createMany(tenantId, [
      {
        relatedType: ReminderRelatedType.BOOKING,
        relatedId: booking.id,
        remindAt,
        channel: ReminderChannel.PUSH,
        recipient: ReminderRecipient.OWNER,
        message: `Mañana: "${booking.title}" con ${booking.clientName} (${when}).`,
      },
    ]);
  }

  dismissForBooking(tenantId: string, bookingId: string) {
    return this.remindersRepository.dismissPendingFor(
      tenantId,
      ReminderRelatedType.BOOKING,
      bookingId,
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async dispatchDue() {
    const dueReminders = await this.remindersRepository.findDuePending(
      new Date(),
    );
    // Safety net for reminders whose invoice was closed without dismissing them.
    const closedInvoiceIds =
      await this.remindersRepository.findClosedInvoiceIds(
        dueReminders
          .filter((r) => r.relatedType === ReminderRelatedType.INVOICE)
          .map((r) => r.relatedId),
      );

    const remindersByTenant = new Map<string, Reminder[]>();
    for (const reminder of dueReminders) {
      if (
        reminder.relatedType === ReminderRelatedType.INVOICE &&
        closedInvoiceIds.has(reminder.relatedId)
      ) {
        await this.remindersRepository.claim(
          reminder.id,
          ReminderStatus.DISMISSED,
        );
        continue;
      }
      const tenantReminders = remindersByTenant.get(reminder.tenantId) ?? [];
      tenantReminders.push(reminder);
      remindersByTenant.set(reminder.tenantId, tenantReminders);
    }

    for (const [tenantId, reminders] of remindersByTenant) {
      const owners =
        await this.usersRepository.findOwnersWithPushTokens(tenantId);
      for (const reminder of reminders) {
        const claimed = await this.remindersRepository.claim(
          reminder.id,
          ReminderStatus.SENT,
        );
        if (!claimed) continue; // another instance already took it
        try {
          await this.dispatchOne(owners, reminder);
        } catch (error) {
          this.logger.error(
            `Failed to dispatch reminder ${reminder.id}`,
            error,
          );
          await this.remindersRepository.release(reminder.id);
        }
      }
    }
  }

  private async dispatchOne(owners: Owners, reminder: Reminder) {
    const title =
      reminder.relatedType === ReminderRelatedType.BOOKING
        ? 'Sesión próxima'
        : 'Recordatorio de pago';

    if (reminder.channel === ReminderChannel.PUSH) {
      const tokens = owners.flatMap((owner) =>
        owner.pushTokens.map((t) => t.token),
      );
      await this.pushService.sendToTokens(tokens, title, reminder.message, {
        type: reminder.relatedType,
        id: reminder.relatedId,
      });
      return;
    }

    if (reminder.recipient === ReminderRecipient.CLIENT) {
      if (reminder.recipientEmail) {
        await this.emailService.send(
          reminder.recipientEmail,
          title,
          reminder.message,
        );
      }
      return;
    }

    for (const owner of owners) {
      await this.emailService.send(owner.email, title, reminder.message);
    }
  }
}
