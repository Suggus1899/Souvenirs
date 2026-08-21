import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.paymentsService.findAll(tenantId, invoiceId);
  }
}
