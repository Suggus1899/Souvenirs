import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { RemindersModule } from '../reminders/reminders.module';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  imports: [InvoicesModule, RemindersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
