import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { TenantsService } from './tenants.service';

@Controller('tenants')
@UseGuards(AuthGuard('jwt'))
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getMe(@CurrentTenant() tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Post('me/stripe/onboarding-link')
  createStripeOnboardingLink(@CurrentTenant() tenantId: string) {
    return this.tenantsService.createStripeOnboardingLink(tenantId);
  }
}
