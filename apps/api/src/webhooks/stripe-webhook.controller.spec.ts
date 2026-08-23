import { BadRequestException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { StripeWebhookController } from './stripe-webhook.controller';

describe('StripeWebhookController', () => {
  function buildController() {
    const stripeService = {
      constructEvent: jest.fn(),
    };
    const paymentsService = {
      recordStripePayment: jest.fn().mockResolvedValue(undefined),
    };
    const tenantsService = {
      applyStripeOnboardingStatus: jest.fn().mockResolvedValue(undefined),
      linkStripeCustomer: jest.fn().mockResolvedValue(undefined),
      applySubscriptionEvent: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new StripeWebhookController(
      stripeService as never,
      paymentsService as never,
      tenantsService as never,
    );
    return { controller, stripeService, paymentsService, tenantsService };
  }

  function buildRequest(event: unknown) {
    return {
      rawBody: Buffer.from('raw'),
      event,
    } as never;
  }

  it('rejects a request with no raw body', async () => {
    const { controller } = buildController();

    await expect(
      controller.handleWebhook({ rawBody: undefined } as never, 'sig'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a request with an invalid Stripe signature', async () => {
    const { controller, stripeService } = buildController();
    stripeService.constructEvent.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(
      controller.handleWebhook(buildRequest(undefined), 'bad-sig'),
    ).rejects.toThrow(BadRequestException);
  });

  it('records a payment for a completed one-off checkout session', async () => {
    const { controller, stripeService, paymentsService } = buildController();
    stripeService.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          mode: 'payment',
          amount_total: 5000,
          payment_intent: 'pi_1',
          metadata: { invoiceId: 'inv_1', tenantId: 'tenant_1' },
        },
      },
    });

    await controller.handleWebhook(buildRequest(undefined), 'sig');

    expect(paymentsService.recordStripePayment).toHaveBeenCalledWith(
      'tenant_1',
      'inv_1',
      50,
      'pi_1',
    );
  });

  it('links the Stripe customer for a completed subscription checkout session', async () => {
    const { controller, stripeService, tenantsService } = buildController();
    stripeService.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_2',
          mode: 'subscription',
          customer: 'cus_1',
          metadata: { tenantId: 'tenant_1' },
        },
      },
    });

    await controller.handleWebhook(buildRequest(undefined), 'sig');

    expect(tenantsService.linkStripeCustomer).toHaveBeenCalledWith(
      'tenant_1',
      'cus_1',
    );
  });

  it('applies Connect onboarding status on account.updated', async () => {
    const { controller, stripeService, tenantsService } = buildController();
    stripeService.constructEvent.mockReturnValue({
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_1',
          details_submitted: true,
          charges_enabled: true,
        },
      },
    });

    await controller.handleWebhook(buildRequest(undefined), 'sig');

    expect(tenantsService.applyStripeOnboardingStatus).toHaveBeenCalledWith(
      'acct_1',
      true,
    );
  });

  it('applies an active PRO subscription on customer.subscription.updated', async () => {
    const { controller, stripeService, tenantsService } = buildController();
    stripeService.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'active',
        },
      },
    });

    await controller.handleWebhook(buildRequest(undefined), 'sig');

    expect(tenantsService.applySubscriptionEvent).toHaveBeenCalledWith(
      'cus_1',
      {
        plan: Plan.PRO,
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'active',
      },
    );
  });

  it('downgrades to FREE on customer.subscription.deleted', async () => {
    const { controller, stripeService, tenantsService } = buildController();
    stripeService.constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'canceled',
        },
      },
    });

    await controller.handleWebhook(buildRequest(undefined), 'sig');

    expect(tenantsService.applySubscriptionEvent).toHaveBeenCalledWith(
      'cus_1',
      {
        plan: Plan.FREE,
        stripeSubscriptionId: null,
        subscriptionStatus: 'canceled',
      },
    );
  });

  it('acknowledges but ignores an unhandled event type', async () => {
    const { controller, stripeService, tenantsService, paymentsService } =
      buildController();
    stripeService.constructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: { object: {} },
    });

    const result = await controller.handleWebhook(
      buildRequest(undefined),
      'sig',
    );

    expect(result).toEqual({ received: true });
    expect(tenantsService.applySubscriptionEvent).not.toHaveBeenCalled();
    expect(paymentsService.recordStripePayment).not.toHaveBeenCalled();
  });
});
