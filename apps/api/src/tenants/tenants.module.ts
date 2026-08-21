import { Module } from '@nestjs/common';
import { StripeModule } from '../stripe/stripe.module';
import { TenantsController } from './tenants.controller';
import { TenantsRepository } from './tenants.repository';
import { TenantsService } from './tenants.service';

@Module({
  imports: [StripeModule],
  controllers: [TenantsController],
  providers: [TenantsRepository, TenantsService],
  exports: [TenantsRepository, TenantsService],
})
export class TenantsModule {}
