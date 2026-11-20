import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { PublicController } from './public.controller';

@Module({
  imports: [InvoicesModule],
  controllers: [PublicController],
})
export class PublicModule {}
