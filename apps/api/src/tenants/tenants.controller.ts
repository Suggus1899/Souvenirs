import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
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
  @Roles(Role.OWNER)
  @UseGuards(RolesGuard)
  createStripeOnboardingLink(@CurrentTenant() tenantId: string) {
    return this.tenantsService.createStripeOnboardingLink(tenantId);
  }

  @Post('me/billing/checkout-session')
  @Roles(Role.OWNER)
  @UseGuards(RolesGuard)
  createBillingCheckoutSession(@CurrentTenant() tenantId: string) {
    return this.tenantsService.createBillingCheckoutSession(tenantId);
  }

  @Post('me/billing/portal')
  @Roles(Role.OWNER)
  @UseGuards(RolesGuard)
  createBillingPortalSession(@CurrentTenant() tenantId: string) {
    return this.tenantsService.createBillingPortalSession(tenantId);
  }
}
