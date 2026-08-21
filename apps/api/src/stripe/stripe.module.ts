import { Module } from '@nestjs/common';
import { stripeClientProvider } from './stripe-client.provider';
import { StripeService } from './stripe.service';

@Module({
  providers: [stripeClientProvider, StripeService],
  exports: [StripeService],
})
export class StripeModule {}
