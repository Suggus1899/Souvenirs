import { ListClientsQueryDto } from './dto/list-clients-query.dto';
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ListClientsQueryDto,
  ) {
    return this.clientsService.findAll(tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.clientsService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.clientsService.remove(tenantId, id);
  }
}
