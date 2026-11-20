import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  function buildService(
    tenant: { plan: 'FREE' | 'PRO' },
    invoiceCountThisMonth: number,
  ) {
    const invoicesRepository = {
      // Mirrors the real atomic repository method: null means the caller-supplied
      // monthlyLimit was already reached, otherwise the invoice is "created".
      create: jest
        .fn()
        .mockImplementation(
          (_tenantId: string, _dto: unknown, monthlyLimit?: number) =>
            Promise.resolve(
              monthlyLimit !== undefined &&
                invoiceCountThisMonth >= monthlyLimit
                ? null
                : { id: 'invoice_1' },
            ),
        ),
    };
    const clientsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'client_1' }),
    };
    const bookingsService = { findOne: jest.fn() };
    const tenantsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'tenant_1', ...tenant }),
    };
    const stripeService = {
      createCheckoutSession: jest
        .fn()
        .mockResolvedValue({ id: 'cs_1', url: 'https://stripe.test/cs_1' }),
    };
    const remindersService = {
      scheduleForInvoice: jest.fn().mockResolvedValue(undefined),
      dismissForInvoice: jest.fn().mockResolvedValue(undefined),
    };
    const emailService = { send: jest.fn().mockResolvedValue(undefined) };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('https://app.test'),
    };

    const service = new InvoicesService(
      invoicesRepository as never,
      clientsService as never,
      bookingsService as never,
      tenantsService as never,
      stripeService as never,
      remindersService as never,
      emailService as never,
      configService as never,
    );
    return {
      service,
      invoicesRepository,
      clientsService,
      tenantsService,
      stripeService,
      remindersService,
      emailService,
    };
  }

  it('blocks invoice creation past the free plan monthly limit', async () => {
    const { service } = buildService({ plan: 'FREE' }, 5);

    await expect(
      service.create('tenant_1', {
        clientId: 'client_1',
        totalAmount: 100,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows invoice creation on the free plan under the limit', async () => {
    const { service, invoicesRepository } = buildService({ plan: 'FREE' }, 4);

    await service.create('tenant_1', {
      clientId: 'client_1',
      totalAmount: 100,
    });

    expect(invoicesRepository.create).toHaveBeenCalledWith(
      'tenant_1',
      expect.objectContaining({ clientId: 'client_1' }),
      5,
    );
  });

  it('never limits invoice creation on the pro plan', async () => {
    const { service, invoicesRepository } = buildService({ plan: 'PRO' }, 999);

    await service.create('tenant_1', {
      clientId: 'client_1',
      totalAmount: 100,
    });

    expect(invoicesRepository.create).toHaveBeenCalledWith(
      'tenant_1',
      expect.objectContaining({ clientId: 'client_1' }),
      undefined,
    );
  });

  const draft = {
    id: 'inv_1',
    number: 7,
    clientId: 'client_1',
    status: InvoiceStatus.DRAFT,
    publicToken: 'tok_1',
    totalAmount: new Prisma.Decimal(100),
    currency: 'USD',
    dueDate: new Date('2030-01-10'),
    items: [],
    payments: [],
  };

  it('sending emails the client the payment link and schedules reminders', async () => {
    const {
      service,
      invoicesRepository,
      clientsService,
      remindersService,
      emailService,
    } = buildService({ plan: 'PRO' }, 0);
    Object.assign(invoicesRepository, {
      findOne: jest.fn().mockResolvedValue(draft),
      markSent: jest
        .fn()
        .mockResolvedValue({ ...draft, status: InvoiceStatus.SENT }),
    });
    clientsService.findOne.mockResolvedValue({
      id: 'client_1',
      name: 'Ana',
      email: 'ana@example.com',
    });

    await service.send('tenant_1', 'inv_1');

    expect(emailService.send).toHaveBeenCalledWith(
      'ana@example.com',
      expect.stringContaining('#7'),
      expect.stringContaining('https://app.test/pay/tok_1'),
    );
    expect(remindersService.scheduleForInvoice).toHaveBeenCalledTimes(1);
  });

  it('still sends the invoice when the email provider fails', async () => {
    const { service, invoicesRepository, clientsService, emailService } =
      buildService({ plan: 'PRO' }, 0);
    Object.assign(invoicesRepository, {
      findOne: jest.fn().mockResolvedValue(draft),
      markSent: jest
        .fn()
        .mockResolvedValue({ ...draft, status: InvoiceStatus.SENT }),
    });
    clientsService.findOne.mockResolvedValue({
      id: 'client_1',
      name: 'Ana',
      email: 'ana@example.com',
    });
    emailService.send.mockRejectedValueOnce(new Error('Resend down'));

    await expect(service.send('tenant_1', 'inv_1')).resolves.toMatchObject({
      status: InvoiceStatus.SENT,
    });
  });

  it('charges only the remaining balance in Stripe Checkout', async () => {
    const { service, invoicesRepository, tenantsService, stripeService } =
      buildService({ plan: 'PRO' }, 0);
    tenantsService.findOne.mockResolvedValue({
      id: 'tenant_1',
      name: 'Studio',
      stripeAccountId: 'acct_1',
      stripeOnboarded: true,
    });
    Object.assign(invoicesRepository, {
      findOne: jest.fn().mockResolvedValue({
        ...draft,
        status: InvoiceStatus.PARTIAL,
        payments: [{ amount: new Prisma.Decimal('40.50') }],
      }),
      setStripeCheckout: jest.fn().mockResolvedValue(undefined),
    });

    await service.createCheckoutSession('tenant_1', 'inv_1');

    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ amountInCents: 5950 }),
    );
  });

  it('refuses to edit the total of an itemised invoice directly', async () => {
    const { service, invoicesRepository } = buildService({ plan: 'PRO' }, 0);
    Object.assign(invoicesRepository, {
      findOne: jest.fn().mockResolvedValue({
        ...draft,
        items: [{ id: 'item_1' }],
      }),
    });

    await expect(
      service.update('tenant_1', 'inv_1', { totalAmount: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
