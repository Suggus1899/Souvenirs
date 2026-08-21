import { Module } from '@nestjs/common';
import { ExchangeRateController } from './exchange-rate.controller';
import { ExchangeRateRepository } from './exchange-rate.repository';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  controllers: [ExchangeRateController],
  providers: [ExchangeRateService, ExchangeRateRepository],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
