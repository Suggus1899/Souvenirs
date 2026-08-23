import { ForbiddenException } from '@nestjs/common';
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
    const stripeService = {};
    const remindersService = { createForInvoiceDueDate: jest.fn() };

    const service = new InvoicesService(
      invoicesRepository as never,
      clientsService as never,
      bookingsService as never,
      tenantsService as never,
      stripeService as never,
      remindersService as never,
    );
    return { service, invoicesRepository };
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
});
