import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service';
import { TenantsService } from '../tenants/tenants.service';
import { StripeService } from '../stripe/stripe.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructEvent(req.rawBody, signature);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid signature';
      throw new BadRequestException(
        `Webhook signature verification failed: ${message}`,
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const invoiceId = session.metadata?.invoiceId;
    const tenantId = session.metadata?.tenantId;
    if (!invoiceId || !tenantId) {
      this.logger.warn(
        `Checkout session ${session.id} is missing invoice/tenant metadata`,
      );
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!paymentIntentId) {
      this.logger.warn(`Checkout session ${session.id} has no payment intent`);
      return;
    }

    const amount = (session.amount_total ?? 0) / 100;
    await this.paymentsService.recordStripePayment(
      tenantId,
      invoiceId,
      amount,
      paymentIntentId,
    );
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    const onboarded = Boolean(
      account.details_submitted && account.charges_enabled,
    );
    await this.tenantsService.applyStripeOnboardingStatus(
      account.id,
      onboarded,
    );
  }
}
