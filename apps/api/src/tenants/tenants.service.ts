import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Plan } from '@prisma/client';
import { StripeService } from '../stripe/stripe.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly stripeService: StripeService,
  ) {}

  async findOne(tenantId: string) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Estudio no encontrado');
    }
    return tenant;
  }

  updateSettings(tenantId: string, dto: UpdateTenantDto) {
    return this.tenantsRepository.updateSettings(tenantId, dto);
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

  async createBillingCheckoutSession(tenantId: string) {
    const tenant = await this.findOne(tenantId);
    if (tenant.plan === Plan.PRO) {
      throw new BadRequestException('Ya tienes una suscripción Pro activa');
    }
    const session = await this.stripeService.createSubscriptionCheckoutSession({
      tenantId,
      customerId: tenant.stripeCustomerId ?? undefined,
    });
    return { url: session.url };
  }

  async createBillingPortalSession(tenantId: string) {
    const tenant = await this.findOne(tenantId);
    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('Todavía no tienes una suscripción activa');
    }
    const session = await this.stripeService.createBillingPortalSession(
      tenant.stripeCustomerId,
    );
    return { url: session.url };
  }

  /** Called from the Stripe webhook — the tenant is looked up by customerId, not tenantId. */
  async applySubscriptionEvent(
    stripeCustomerId: string,
    input: {
      plan: Plan;
      stripeSubscriptionId: string | null;
      subscriptionStatus: string | null;
    },
  ) {
    const tenant =
      await this.tenantsRepository.findByStripeCustomerId(stripeCustomerId);
    if (!tenant) {
      this.logger.warn(
        `Subscription event for unknown Stripe customer ${stripeCustomerId}`,
      );
      return;
    }
    await this.tenantsRepository.applySubscriptionState(tenant.id, input);
  }

  /** Called from checkout.session.completed, where the tenant is known via metadata. */
  async linkStripeCustomer(tenantId: string, stripeCustomerId: string) {
    await this.tenantsRepository.setStripeCustomerId(
      tenantId,
      stripeCustomerId,
    );
  }
}
