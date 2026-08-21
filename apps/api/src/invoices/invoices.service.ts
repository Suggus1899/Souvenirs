import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { ClientsService } from '../clients/clients.service';
import { RemindersService } from '../reminders/reminders.service';
import { StripeService } from '../stripe/stripe.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesRepository } from './invoices.repository';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly clientsService: ClientsService,
    private readonly bookingsService: BookingsService,
    private readonly tenantsService: TenantsService,
    private readonly stripeService: StripeService,
    private readonly remindersService: RemindersService,
  ) {}

  async create(tenantId: string, dto: CreateInvoiceDto) {
    await this.clientsService.findOne(tenantId, dto.clientId);
    if (dto.bookingId) {
      await this.bookingsService.findOne(tenantId, dto.bookingId);
    }
    const invoice = await this.invoicesRepository.create(tenantId, dto);

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

  findAll(tenantId: string) {
    return this.invoicesRepository.findAll(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.invoicesRepository.findOne(tenantId, id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(tenantId, id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be edited');
    }
    return this.invoicesRepository.update(tenantId, id, dto);
  }

  async send(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be sent');
    }
    return this.invoicesRepository.updateStatus(
      tenantId,
      id,
      InvoiceStatus.SENT,
    );
  }

  async cancel(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('A paid invoice cannot be cancelled');
    }
    return this.invoicesRepository.updateStatus(
      tenantId,
      id,
      InvoiceStatus.CANCELLED,
    );
  }

  async setStatus(tenantId: string, id: string, status: InvoiceStatus) {
    await this.findOne(tenantId, id);
    return this.invoicesRepository.updateStatus(tenantId, id, status);
  }

  async createCheckoutSession(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException('This invoice is not open for payment');
    }

    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant.stripeAccountId || !tenant.stripeOnboarded) {
      throw new BadRequestException(
        'Complete Stripe onboarding before accepting online payments',
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
