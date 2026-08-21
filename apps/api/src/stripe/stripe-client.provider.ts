import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

export const stripeClientProvider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    new Stripe(configService.getOrThrow<string>('STRIPE_SECRET_KEY')),
};
