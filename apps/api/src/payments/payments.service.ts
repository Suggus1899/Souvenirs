import { BadRequestException, Injectable } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import {
  isOpenForPayment,
  statusAfterPayment,
} from '../invoices/invoice-status';
import { InvoicesService } from '../invoices/invoices.service';
import { RemindersService } from '../reminders/reminders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentInput, PaymentsRepository } from './payments.repository';

type OwnedInvoice = Awaited<ReturnType<InvoicesService['findOne']>>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly invoicesService: InvoicesService,
    private readonly remindersService: RemindersService,
  ) {}

  async create(tenantId: string, dto: CreatePaymentDto) {
    if (dto.method === PaymentMethod.STRIPE) {
      throw new BadRequestException(
        'Los pagos con Stripe se registran automáticamente',
      );
    }

    const invoice = await this.invoicesService.findOne(tenantId, dto.invoiceId);
    if (!isOpenForPayment(invoice.status)) {
      throw new BadRequestException('Esta factura no admite pagos');
    }

    // Manual payments can't exceed what is still owed. Stripe payments skip this
    // check on purpose: that money was already charged, so it must be recorded.
    const alreadyPaid = await this.paymentsRepository.sumByInvoice(
      tenantId,
      invoice.id,
    );
    const remaining = invoice.totalAmount.minus(alreadyPaid);
    if (new Prisma.Decimal(dto.amount).gt(remaining)) {
      throw new BadRequestException(
        `El monto supera el saldo pendiente (${remaining.toFixed(2)} ${invoice.currency})`,
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
    try {
      return await this.registerPayment(tenantId, invoice, {
        invoiceId,
        amount,
        method: PaymentMethod.STRIPE,
        stripePaymentIntentId,
      });
    } catch (error) {
      // Two concurrent webhook deliveries for the same payment intent can both
      // pass the check above before either commits — the unique index on
      // stripePaymentIntentId is the real guard; recover by returning the row
      // the other delivery just inserted instead of failing this one.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingAfterRace =
          await this.paymentsRepository.findByStripePaymentIntentId(
            tenantId,
            stripePaymentIntentId,
          );
        if (existingAfterRace) {
          return existingAfterRace;
        }
      }
      throw error;
    }
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
    const newStatus = statusAfterPayment(invoice, totalPaid);
    await this.invoicesService.setStatus(tenantId, input.invoiceId, newStatus);
    if (newStatus === InvoiceStatus.PAID) {
      await this.remindersService.dismissForInvoice(tenantId, input.invoiceId);
    }
    return payment;
  }
}
