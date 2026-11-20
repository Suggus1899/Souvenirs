import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
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
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ListInvoicesQueryDto,
  ) {
    return this.invoicesService.findAll(tenantId, query);
  }

  /** Declared before :id so "export" isn't read as an invoice id. */
  @Get('export')
  async export(
    @CurrentTenant() tenantId: string,
    @Query() query: ListInvoicesQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.invoicesService.exportCsv(tenantId, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="facturas.csv"');
    // BOM so Excel opens the UTF-8 accents correctly.
    return `\uFEFF${csv}`;
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
