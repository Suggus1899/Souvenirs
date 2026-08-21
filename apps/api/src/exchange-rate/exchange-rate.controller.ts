import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExchangeRateService } from './exchange-rate.service';

@Controller('exchange-rate')
@UseGuards(AuthGuard('jwt'))
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
  findAll() {
    return this.exchangeRateService.findAll();
  }
}
