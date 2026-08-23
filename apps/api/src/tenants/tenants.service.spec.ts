import { BadRequestException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  function buildService(tenant: {
    id: string;
    stripeAccountId: string | null;
    plan?: 'FREE' | 'PRO';
    stripeCustomerId?: string | null;
  }) {
    const tenantsRepository = {
      findById: jest.fn().mockResolvedValue({ plan: 'FREE', ...tenant }),
      setStripeAccountId: jest
        .fn()
        .mockResolvedValue({ ...tenant, stripeAccountId: 'acct_new' }),
      findByStripeAccountId: jest.fn(),
      setStripeOnboarded: jest.fn(),
      setStripeCustomerId: jest.fn(),
      findByStripeCustomerId: jest.fn(),
      applySubscriptionState: jest.fn(),
    };
    const stripeService = {
      createExpressAccount: jest.fn().mockResolvedValue({ id: 'acct_new' }),
      createAccountLink: jest.fn().mockResolvedValue({
        url: 'https://connect.stripe.com/setup/acct_new',
      }),
      createSubscriptionCheckoutSession: jest
        .fn()
        .mockResolvedValue({ url: 'https://checkout.stripe.com/session' }),
      createBillingPortalSession: jest
        .fn()
        .mockResolvedValue({ url: 'https://billing.stripe.com/portal' }),
    };
    const service = new TenantsService(
      tenantsRepository as never,
      stripeService as never,
    );
    return { service, tenantsRepository, stripeService };
  }

  it('creates a Connect account only once and reuses it on later onboarding links', async () => {
    const { service, stripeService } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
    });

    await service.createStripeOnboardingLink('tenant_1');

    expect(stripeService.createExpressAccount).toHaveBeenCalledTimes(1);
  });

  it('does not create a new Connect account if the tenant already has one', async () => {
    const { service, stripeService } = buildService({
      id: 'tenant_1',
      stripeAccountId: 'acct_existing',
    });

    const result = await service.createStripeOnboardingLink('tenant_1');

    expect(stripeService.createExpressAccount).not.toHaveBeenCalled();
    expect(stripeService.createAccountLink).toHaveBeenCalledWith(
      'acct_existing',
    );
    expect(result.url).toBeDefined();
  });

  it('refuses to create a billing checkout session for a tenant already on Pro', async () => {
    const { service, stripeService } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
      plan: 'PRO',
    });

    await expect(
      service.createBillingCheckoutSession('tenant_1'),
    ).rejects.toThrow(BadRequestException);
    expect(
      stripeService.createSubscriptionCheckoutSession,
    ).not.toHaveBeenCalled();
  });

  it('creates a billing checkout session for a tenant on the free plan', async () => {
    const { service, stripeService } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
      plan: 'FREE',
    });

    const result = await service.createBillingCheckoutSession('tenant_1');

    expect(stripeService.createSubscriptionCheckoutSession).toHaveBeenCalled();
    expect(result.url).toBeDefined();
  });

  it('refuses to create a billing portal session without a Stripe customer', async () => {
    const { service, stripeService } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
      stripeCustomerId: null,
    });

    await expect(
      service.createBillingPortalSession('tenant_1'),
    ).rejects.toThrow(BadRequestException);
    expect(stripeService.createBillingPortalSession).not.toHaveBeenCalled();
  });

  it('creates a billing portal session for a tenant with a Stripe customer', async () => {
    const { service, stripeService } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
      stripeCustomerId: 'cus_1',
    });

    const result = await service.createBillingPortalSession('tenant_1');

    expect(stripeService.createBillingPortalSession).toHaveBeenCalledWith(
      'cus_1',
    );
    expect(result.url).toBeDefined();
  });

  it('links a Stripe customer id to a tenant', async () => {
    const { service, tenantsRepository } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
    });

    await service.linkStripeCustomer('tenant_1', 'cus_1');

    expect(tenantsRepository.setStripeCustomerId).toHaveBeenCalledWith(
      'tenant_1',
      'cus_1',
    );
  });

  it('applies a subscription event to the tenant matched by Stripe customer id', async () => {
    const { service, tenantsRepository } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
    });
    tenantsRepository.findByStripeCustomerId.mockResolvedValue({
      id: 'tenant_1',
    });

    await service.applySubscriptionEvent('cus_1', {
      plan: 'PRO',
      stripeSubscriptionId: 'sub_1',
      subscriptionStatus: 'active',
    });

    expect(tenantsRepository.applySubscriptionState).toHaveBeenCalledWith(
      'tenant_1',
      {
        plan: 'PRO',
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'active',
      },
    );
  });

  it('ignores a subscription event for an unknown Stripe customer', async () => {
    const { service, tenantsRepository } = buildService({
      id: 'tenant_1',
      stripeAccountId: null,
    });
    tenantsRepository.findByStripeCustomerId.mockResolvedValue(null);

    await service.applySubscriptionEvent('cus_unknown', {
      plan: 'FREE',
      stripeSubscriptionId: null,
      subscriptionStatus: null,
    });

    expect(tenantsRepository.applySubscriptionState).not.toHaveBeenCalled();
  });
});
