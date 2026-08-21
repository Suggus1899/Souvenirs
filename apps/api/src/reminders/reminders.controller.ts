import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(AuthGuard('jwt'))
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.remindersService.findAll(tenantId);
  }
}
