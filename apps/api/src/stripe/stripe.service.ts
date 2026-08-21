import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './stripe-client.provider';

interface CreateCheckoutSessionParams {
  invoiceId: string;
  tenantId: string;
  connectedAccountId: string;
  currency: string;
  amountInCents: number;
  description: string;
}

@Injectable()
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly configService: ConfigService,
  ) {}

  createExpressAccount(): Promise<Stripe.Account> {
    return this.stripe.accounts.create({ type: 'express' });
  }

  createAccountLink(accountId: string): Promise<Stripe.AccountLink> {
    const webAppUrl = this.configService.getOrThrow<string>('WEB_APP_URL');
    return this.stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${webAppUrl}/settings/stripe/refresh`,
      return_url: `${webAppUrl}/settings/stripe/return`,
    });
  }

  createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<Stripe.Checkout.Session> {
    const webAppUrl = this.configService.getOrThrow<string>('WEB_APP_URL');
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: params.description },
            unit_amount: params.amountInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_data: { destination: params.connectedAccountId },
      },
      metadata: { invoiceId: params.invoiceId, tenantId: params.tenantId },
      success_url: `${webAppUrl}/invoices/${params.invoiceId}?payment=success`,
      cancel_url: `${webAppUrl}/invoices/${params.invoiceId}?payment=cancelled`,
    });
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
