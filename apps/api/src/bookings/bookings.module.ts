import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { ServicesModule } from '../services/services.module';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';

@Module({
  imports: [ClientsModule, ServicesModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService],
})
export class BookingsModule {}
