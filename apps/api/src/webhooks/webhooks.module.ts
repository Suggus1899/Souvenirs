import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { StripeModule } from '../stripe/stripe.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [StripeModule, PaymentsModule, TenantsModule],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}
