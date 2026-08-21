import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  function buildService(tenant: {
    id: string;
    stripeAccountId: string | null;
  }) {
    const tenantsRepository = {
      findById: jest.fn().mockResolvedValue(tenant),
      setStripeAccountId: jest
        .fn()
        .mockResolvedValue({ ...tenant, stripeAccountId: 'acct_new' }),
      findByStripeAccountId: jest.fn(),
      setStripeOnboarded: jest.fn(),
    };
    const stripeService = {
      createExpressAccount: jest.fn().mockResolvedValue({ id: 'acct_new' }),
      createAccountLink: jest.fn().mockResolvedValue({
        url: 'https://connect.stripe.com/setup/acct_new',
      }),
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
});
