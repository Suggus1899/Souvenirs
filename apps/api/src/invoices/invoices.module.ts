import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { ClientsModule } from '../clients/clients.module';
import { RemindersModule } from '../reminders/reminders.module';
import { StripeModule } from '../stripe/stripe.module';
import { TenantsModule } from '../tenants/tenants.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    ClientsModule,
    BookingsModule,
    TenantsModule,
    StripeModule,
    RemindersModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository],
  exports: [InvoicesService],
})
export class InvoicesModule {}
