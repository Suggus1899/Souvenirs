import { BadRequestException, Injectable } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentInput, PaymentsRepository } from './payments.repository';

type OwnedInvoice = Awaited<ReturnType<InvoicesService['findOne']>>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly invoicesService: InvoicesService,
  ) {}

  async create(tenantId: string, dto: CreatePaymentDto) {
    if (dto.method === PaymentMethod.STRIPE) {
      throw new BadRequestException(
        'Stripe payments are recorded automatically via webhook',
      );
    }

    const invoice = await this.invoicesService.findOne(tenantId, dto.invoiceId);
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot register a payment on a cancelled invoice',
      );
    }

    return this.registerPayment(tenantId, invoice, dto);
  }

  /** Called by the Stripe webhook once a checkout session is paid. Idempotent per payment intent. */
  async recordStripePayment(
    tenantId: string,
    invoiceId: string,
    amount: number,
    stripePaymentIntentId: string,
  ) {
    const existing = await this.paymentsRepository.findByStripePaymentIntentId(
      tenantId,
      stripePaymentIntentId,
    );
    if (existing) {
      return existing;
    }

    const invoice = await this.invoicesService.findOne(tenantId, invoiceId);
    return this.registerPayment(tenantId, invoice, {
      invoiceId,
      amount,
      method: PaymentMethod.STRIPE,
      stripePaymentIntentId,
    });
  }

  findAll(tenantId: string, invoiceId?: string) {
    return this.paymentsRepository.findAll(tenantId, invoiceId);
  }

  private async registerPayment(
    tenantId: string,
    invoice: OwnedInvoice,
    input: CreatePaymentInput,
  ) {
    const payment = await this.paymentsRepository.create(tenantId, input);
    const totalPaid = await this.paymentsRepository.sumByInvoice(
      tenantId,
      input.invoiceId,
    );
    const newStatus = totalPaid.gte(invoice.totalAmount)
      ? InvoiceStatus.PAID
      : InvoiceStatus.PARTIAL;
    await this.invoicesService.setStatus(tenantId, input.invoiceId, newStatus);
    return payment;
  }
}
