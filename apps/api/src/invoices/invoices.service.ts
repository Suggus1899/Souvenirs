import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceStatus, Plan } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { ClientsService } from '../clients/clients.service';
import { RemindersService } from '../reminders/reminders.service';
import { StripeService } from '../stripe/stripe.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import {
  canCancel,
  canEdit,
  canSend,
  isOpenForPayment,
  overdueCutoff,
} from './invoice-status';
import { InvoicesRepository } from './invoices.repository';

const FREE_PLAN_MONTHLY_INVOICE_LIMIT = 5;

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
        `Llegaste al límite de ${FREE_PLAN_MONTHLY_INVOICE_LIMIT} facturas de tu plan gratis este mes. Actualizá a Pro para seguir facturando.`,
      );
    }

    if (invoice.dueDate) {
      const message = `Payment of ${invoice.totalAmount.toString()} ${invoice.currency} is due for invoice ${invoice.id}`;
      await this.remindersService.createForInvoiceDueDate(
        tenantId,
        invoice.id,
        invoice.dueDate,
        message,
      );
    }

    return invoice;
  }

  findAll(tenantId: string, query: ListInvoicesQueryDto = {}) {
    return this.invoicesRepository.findAll(tenantId, query);
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
    return this.invoicesRepository.update(tenantId, id, dto);
  }

  async send(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (!canSend(invoice.status)) {
      throw new BadRequestException(
        'Solo se pueden enviar facturas en borrador',
      );
    }
    return this.invoicesRepository.updateStatus(
      tenantId,
      id,
      InvoiceStatus.SENT,
    );
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

  async createCheckoutSession(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (!isOpenForPayment(invoice.status)) {
      throw new BadRequestException('Esta factura no admite pagos');
    }

    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant.stripeAccountId || !tenant.stripeOnboarded) {
      throw new BadRequestException(
        'Completa la conexión con Stripe antes de cobrar online',
      );
    }

    const session = await this.stripeService.createCheckoutSession({
      invoiceId: invoice.id,
      tenantId,
      connectedAccountId: tenant.stripeAccountId,
      currency: invoice.currency,
      amountInCents: Math.round(Number(invoice.totalAmount) * 100),
      description: `Invoice ${invoice.id}`,
    });

    await this.invoicesRepository.setStripeCheckout(
      tenantId,
      id,
      session.id,
      session.url ?? '',
    );
    return { url: session.url };
  }
}
