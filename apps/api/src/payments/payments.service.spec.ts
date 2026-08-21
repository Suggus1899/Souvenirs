import { BadRequestException } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const invoice = {
    id: 'inv_1',
    totalAmount: new Prisma.Decimal(100),
    status: InvoiceStatus.SENT,
  };

  function buildService() {
    const paymentsRepository = {
      create: jest.fn().mockResolvedValue({ id: 'pay_1' }),
      findByStripePaymentIntentId: jest.fn().mockResolvedValue(null),
      sumByInvoice: jest.fn().mockResolvedValue(new Prisma.Decimal(100)),
      findAll: jest.fn(),
    };
    const invoicesService = {
      findOne: jest.fn().mockResolvedValue(invoice),
      setStatus: jest.fn().mockResolvedValue(undefined),
    };
    const service = new PaymentsService(
      paymentsRepository as never,
      invoicesService as never,
    );
    return { service, paymentsRepository, invoicesService };
  }

  it('rejects manual STRIPE-method payments', async () => {
    const { service } = buildService();
    await expect(
      service.create('tenant_1', {
        invoiceId: 'inv_1',
        amount: 50,
        method: PaymentMethod.STRIPE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a Stripe payment and marks the invoice PAID once fully covered', async () => {
    const { service, paymentsRepository, invoicesService } = buildService();

    const payment = await service.recordStripePayment(
      'tenant_1',
      'inv_1',
      100,
      'pi_123',
    );

    expect(payment).toEqual({ id: 'pay_1' });
    expect(paymentsRepository.create).toHaveBeenCalledTimes(1);
    expect(invoicesService.setStatus).toHaveBeenCalledWith(
      'tenant_1',
      'inv_1',
      InvoiceStatus.PAID,
    );
  });

  it('does not double-record the same Stripe payment intent (webhook retries)', async () => {
    const { service, paymentsRepository } = buildService();
    paymentsRepository.findByStripePaymentIntentId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'pay_1',
      });

    await service.recordStripePayment('tenant_1', 'inv_1', 100, 'pi_123');
    const second = await service.recordStripePayment(
      'tenant_1',
      'inv_1',
      100,
      'pi_123',
    );

    expect(paymentsRepository.create).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ id: 'pay_1' });
  });
});
