import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InvoiceStatus } from '@prisma/client';
import { isOpenForPayment } from '../invoices/invoice-status';
import { InvoicesService, paidTotal } from '../invoices/invoices.service';

const PUBLIC_THROTTLE = { default: { ttl: 60_000, limit: 20 } };

/**
 * No login: the client reaches these from the link in the invoice email. The
 * 192-bit publicToken is the only credential, so responses expose just what
 * the client needs to see — never ids, emails or other invoices.
 */
@Controller('public/invoices')
@Throttle(PUBLIC_THROTTLE)
export class PublicController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':token')
  async findOne(@Param('token') token: string) {
    const invoice = await this.invoicesService.findByPublicToken(token);
    // Drafts haven't been sent: to the outside world they don't exist yet.
    if (!invoice || invoice.status === InvoiceStatus.DRAFT) {
      throw new NotFoundException('Factura no encontrada');
    }
    const paid = paidTotal(invoice);
    return {
      number: invoice.number,
      studioName: invoice.tenant.name,
      clientName: invoice.client.name,
      status: invoice.status,
      currency: invoice.currency,
      totalAmount: invoice.totalAmount.toFixed(2),
      paidAmount: paid.toFixed(2),
      balance: invoice.totalAmount.minus(paid).toFixed(2),
      dueDate: invoice.dueDate,
      sentAt: invoice.sentAt,
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      })),
      canPayOnline:
        invoice.tenant.stripeOnboarded && isOpenForPayment(invoice.status),
    };
  }

  @Post(':token/checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(@Param('token') token: string) {
    const invoice = await this.invoicesService.findByPublicToken(token);
    if (!invoice || invoice.status === InvoiceStatus.DRAFT) {
      throw new NotFoundException('Factura no encontrada');
    }
    return this.invoicesService.createPublicCheckoutSession(token);
  }
}
