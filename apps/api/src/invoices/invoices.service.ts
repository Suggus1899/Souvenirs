import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceStatus, Plan, Prisma } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { ClientsService } from '../clients/clients.service';
import { EmailService } from '../notifications/email.service';
import { formatDate } from '../reminders/reminder-schedule';
import { RemindersService } from '../reminders/reminders.service';
import { StripeService } from '../stripe/stripe.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { invoicesToCsv } from './invoice-csv';
import {
  canCancel,
  canEdit,
  canSend,
  isOpenForPayment,
  overdueCutoff,
} from './invoice-status';
import { InvoicesRepository } from './invoices.repository';

const FREE_PLAN_MONTHLY_INVOICE_LIMIT = 5;
const CSV_EXPORT_LIMIT = 5000;

type InvoiceWithPayments = NonNullable<
  Awaited<ReturnType<InvoicesRepository['findOne']>>
>;

export function paidTotal(invoice: {
  payments: { amount: Prisma.Decimal }[];
}): Prisma.Decimal {
  return invoice.payments.reduce(
    (sum, p) => sum.plus(p.amount),
    new Prisma.Decimal(0),
  );
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly clientsService: ClientsService,
    private readonly bookingsService: BookingsService,
    private readonly tenantsService: TenantsService,
    private readonly stripeService: StripeService,
    private readonly remindersService: RemindersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async create(tenantId: string, dto: CreateInvoiceDto) {
    const tenant = await this.tenantsService.findOne(tenantId);
    await this.clientsService.findOne(tenantId, dto.clientId);
    if (dto.bookingId) {
      await this.bookingsService.findOne(tenantId, dto.bookingId);
    }

    const monthlyLimit =
      tenant.plan === Plan.FREE ? FREE_PLAN_MONTHLY_INVOICE_LIMIT : undefined;
    const invoice = await this.invoicesRepository.create(
      tenantId,
      dto,
      monthlyLimit,
    );
    if (!invoice) {
      throw new ForbiddenException(
        `Llegaste al límite de ${FREE_PLAN_MONTHLY_INVOICE_LIMIT} facturas de tu plan gratis este mes. Actualiza a Pro para seguir facturando.`,
      );
    }
    return invoice;
  }

  /** List rows carry `paidAmount` instead of the payments themselves. */
  async findAll(tenantId: string, query: ListInvoicesQueryDto = {}) {
    const invoices = await this.invoicesRepository.findAll(tenantId, query);
    return invoices.map(({ payments, ...invoice }) => ({
      ...invoice,
      paidAmount: paidTotal({ payments }).toFixed(2),
    }));
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.invoicesRepository.findOne(tenantId, id);
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }
    return invoice;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(tenantId, id);
    if (!canEdit(invoice.status)) {
      throw new BadRequestException(
        'Solo se pueden editar facturas en borrador',
      );
    }
    if (
      dto.totalAmount !== undefined &&
      invoice.items.length > 0 &&
      !dto.items
    ) {
      throw new BadRequestException(
        'Esta factura tiene ítems: edita los ítems y el total se recalcula solo',
      );
    }
    return this.invoicesRepository.update(tenantId, id, dto);
  }

  /**
   * DRAFT → SENT. Emails the client the invoice with its payment link (when the
   * client has an email) and schedules the due-date reminders. A failing email
   * provider must not undo the send, so that step only logs.
   */
  async send(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (!canSend(invoice.status)) {
      throw new BadRequestException(
        'Solo se pueden enviar facturas en borrador',
      );
    }
    const [tenant, client] = await Promise.all([
      this.tenantsService.findOne(tenantId),
      this.clientsService.findOne(tenantId, invoice.clientId),
    ]);
    const sent = await this.invoicesRepository.markSent(tenantId, id);

    if (client.email) {
      const payUrl = `${this.configService.getOrThrow<string>('WEB_APP_URL')}/pay/${sent.publicToken}`;
      const due = sent.dueDate ? `\nVence el ${formatDate(sent.dueDate)}.` : '';
      try {
        await this.emailService.send(
          client.email,
          `Factura #${sent.number} de ${tenant.name}`,
          `Hola ${client.name},\n\n${tenant.name} te envió la factura #${sent.number} ` +
            `por ${sent.totalAmount.toString()} ${sent.currency}.${due}\n\n` +
            `Puedes ver el detalle y pagar aquí: ${payUrl}`,
        );
      } catch (error) {
        this.logger.error(`Failed to email invoice ${id}`, error);
      }
    }

    if (sent.dueDate) {
      await this.remindersService.scheduleForInvoice(tenantId, {
        tenant,
        invoice: { ...sent, dueDate: sent.dueDate },
        client,
      });
    }
    return sent;
  }

  async cancel(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (!canCancel(invoice.status)) {
      throw new BadRequestException('Esta factura ya no se puede cancelar');
    }
    const cancelled = await this.invoicesRepository.updateStatus(
      tenantId,
      id,
      InvoiceStatus.CANCELLED,
    );
    await this.remindersService.dismissForInvoice(tenantId, id);
    return cancelled;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async markOverdue() {
    const { count } = await this.invoicesRepository.markOverdue(
      overdueCutoff(new Date()),
    );
    if (count > 0) {
      this.logger.log(`Marked ${count} invoice(s) as overdue`);
    }
  }

  async setStatus(tenantId: string, id: string, status: InvoiceStatus) {
    await this.findOne(tenantId, id);
    return this.invoicesRepository.updateStatus(tenantId, id, status);
  }

  /** Stripe Checkout link from the dashboard; returns to the invoice detail page. */
  async createCheckoutSession(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    const webAppUrl = this.configService.getOrThrow<string>('WEB_APP_URL');
    return this.startCheckout(tenantId, invoice, `${webAppUrl}/invoices/${id}`);
  }

  /** Stripe Checkout started by the client from the public payment page. */
  async createPublicCheckoutSession(publicToken: string) {
    const found = await this.invoicesRepository.findByPublicToken(publicToken);
    if (!found) {
      throw new NotFoundException('Factura no encontrada');
    }
    const webAppUrl = this.configService.getOrThrow<string>('WEB_APP_URL');
    return this.startCheckout(
      found.tenantId,
      found,
      `${webAppUrl}/pay/${publicToken}`,
    );
  }

  findByPublicToken(publicToken: string) {
    return this.invoicesRepository.findByPublicToken(publicToken);
  }

  async exportCsv(tenantId: string, query: ListInvoicesQueryDto = {}) {
    const [invoices, clients] = await Promise.all([
      this.invoicesRepository.findAllForExport(
        tenantId,
        query,
        CSV_EXPORT_LIMIT,
      ),
      this.clientsService.findAll(tenantId, { take: 200 }),
    ]);
    return invoicesToCsv(invoices, clients);
  }

  /** Charges the remaining balance (not the full total) so partial payments aren't charged twice. */
  private async startCheckout(
    tenantId: string,
    invoice: InvoiceWithPayments,
    returnUrl: string,
  ) {
    if (!isOpenForPayment(invoice.status)) {
      throw new BadRequestException('Esta factura no admite pagos');
    }
    const remaining = invoice.totalAmount.minus(paidTotal(invoice));
    if (remaining.lte(0)) {
      throw new BadRequestException('Esta factura no tiene saldo pendiente');
    }

    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant.stripeAccountId || !tenant.stripeOnboarded) {
      throw new BadRequestException(
        'Este estudio todavía no acepta pagos online',
      );
    }

    const session = await this.stripeService.createCheckoutSession({
      invoiceId: invoice.id,
      tenantId,
      connectedAccountId: tenant.stripeAccountId,
      currency: invoice.currency,
      amountInCents: remaining.times(100).round().toNumber(),
      description: `Factura #${invoice.number} — ${tenant.name}`,
      successUrl: `${returnUrl}?payment=success`,
      cancelUrl: `${returnUrl}?payment=cancelled`,
    });

    await this.invoicesRepository.setStripeCheckout(
      tenantId,
      invoice.id,
      session.id,
      session.url ?? '',
    );
    return { url: session.url };
  }
}
