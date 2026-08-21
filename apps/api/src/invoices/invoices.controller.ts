import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(tenantId, dto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.invoicesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(tenantId, id, dto);
  }

  @Post(':id/send')
  send(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.send(tenantId, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.cancel(tenantId, id);
  }

  @Post(':id/checkout-session')
  createCheckoutSession(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.createCheckoutSession(tenantId, id);
  }
}
