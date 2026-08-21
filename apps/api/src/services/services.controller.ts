import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(tenantId, dto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.servicesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.servicesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.servicesService.remove(tenantId, id);
  }
}
