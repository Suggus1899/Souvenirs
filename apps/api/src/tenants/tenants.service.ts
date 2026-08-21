import { Injectable, NotFoundException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly stripeService: StripeService,
  ) {}

  async findOne(tenantId: string) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async createStripeOnboardingLink(tenantId: string) {
    let tenant = await this.findOne(tenantId);

    if (!tenant.stripeAccountId) {
      const account = await this.stripeService.createExpressAccount();
      tenant = await this.tenantsRepository.setStripeAccountId(
        tenantId,
        account.id,
      );
    }

    const accountLink = await this.stripeService.createAccountLink(
      tenant.stripeAccountId!,
    );
    return { url: accountLink.url };
  }

  async applyStripeOnboardingStatus(
    stripeAccountId: string,
    onboarded: boolean,
  ) {
    const tenant =
      await this.tenantsRepository.findByStripeAccountId(stripeAccountId);
    if (!tenant) {
      return;
    }
    await this.tenantsRepository.setStripeOnboarded(tenant.id, onboarded);
  }
}
