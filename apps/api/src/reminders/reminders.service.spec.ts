import { ReminderChannel, ReminderRelatedType } from '@prisma/client';
import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  function buildService() {
    const remindersRepository = {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findAll: jest.fn(),
      findDuePending: jest.fn().mockResolvedValue([]),
      findClosedInvoiceIds: jest.fn().mockResolvedValue(new Set()),
      claim: jest.fn().mockResolvedValue(true),
      release: jest.fn().mockResolvedValue(undefined),
      dismissPendingFor: jest.fn().mockResolvedValue({ count: 0 }),
    };
    const usersRepository = {
      findOwnersWithPushTokens: jest.fn().mockResolvedValue([
        {
          id: 'user_1',
          email: 'owner@example.com',
          pushTokens: [{ token: 'ExponentPushToken[abc]' }],
        },
      ]),
    };
    const pushService = {
      sendToTokens: jest.fn().mockResolvedValue(undefined),
    };
    const emailService = { send: jest.fn().mockResolvedValue(undefined) };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('https://app.test'),
    };
    const service = new RemindersService(
      remindersRepository as never,
      usersRepository as never,
      pushService as never,
      emailService as never,
      configService as never,
    );
    return {
      service,
      remindersRepository,
      usersRepository,
      pushService,
      emailService,
    };
  }

  const ctx = (overrides: {
    offsets?: number[];
    clientReminders?: boolean;
    email?: string | null;
    dueDate?: Date;
  }) => ({
    tenant: {
      name: 'Studio',
      reminderOffsetsDays: overrides.offsets ?? [-3, 0, 3],
      clientRemindersEnabled: overrides.clientReminders ?? true,
    },
    invoice: {
      id: 'inv_1',
      number: 4,
      publicToken: 'tok_1',
      totalAmount: '100.00',
      currency: 'USD',
      dueDate: overrides.dueDate ?? new Date(Date.now() + 10 * 86_400_000),
    },
    client: {
      name: 'Ana',
      email:
        overrides.email === undefined ? 'ana@example.com' : overrides.email,
    },
  });

  type Created = {
    channel: string;
    recipient: string;
    recipientEmail?: string;
    remindAt: Date;
    message: string;
  };
  const created = (repo: { createMany: jest.Mock }) =>
    (repo.createMany.mock.calls[0] as [string, Created[]])[1];

  it('schedules an owner push and a client email per offset, with the payment link', async () => {
    const { service, remindersRepository } = buildService();

    await service.scheduleForInvoice('tenant_1', ctx({}));

    const rows = created(remindersRepository);
    expect(rows).toHaveLength(6);
    const clientEmails = rows.filter((r) => r.recipient === 'CLIENT');
    expect(clientEmails).toHaveLength(3);
    expect(clientEmails[0].recipientEmail).toBe('ana@example.com');
    expect(clientEmails[0].message).toContain('https://app.test/pay/tok_1');
  });

  it('emails the studio on the due day when the client has no email', async () => {
    const { service, remindersRepository } = buildService();

    await service.scheduleForInvoice('tenant_1', ctx({ email: null }));

    const emails = created(remindersRepository).filter(
      (r) => r.channel === ReminderChannel.EMAIL,
    );
    expect(emails).toHaveLength(1);
    expect(emails[0].recipient).toBe('OWNER');
  });

  it('skips reminder dates that are already in the past', async () => {
    const { service, remindersRepository } = buildService();

    await service.scheduleForInvoice(
      'tenant_1',
      ctx({
        dueDate: new Date(Date.now() + 86_400_000),
        clientReminders: false,
      }),
    );

    // -3 days is in the past; 0 and +3 remain (push each, plus studio email at 0).
    const rows = created(remindersRepository);
    expect(rows.filter((r) => r.channel === ReminderChannel.PUSH)).toHaveLength(
      2,
    );
    expect(rows.every((r) => r.remindAt > new Date())).toBe(true);
  });

  it('reschedules a booking reminder 24 h before and none for cancelled bookings', async () => {
    const { service, remindersRepository } = buildService();
    const booking = {
      id: 'bk_1',
      title: 'Boda',
      clientName: 'Ana',
      status: 'CONFIRMED',
      scheduledAt: new Date(Date.now() + 3 * 86_400_000),
    };

    await service.scheduleForBooking('tenant_1', booking);
    expect(remindersRepository.dismissPendingFor).toHaveBeenCalledWith(
      'tenant_1',
      ReminderRelatedType.BOOKING,
      'bk_1',
    );
    expect(remindersRepository.createMany).toHaveBeenCalledTimes(1);

    await service.scheduleForBooking('tenant_1', {
      ...booking,
      status: 'CANCELLED',
    });
    expect(remindersRepository.createMany).toHaveBeenCalledTimes(1);
  });

  it('dispatches due push reminders to owner tokens and marks them sent', async () => {
    const { service, remindersRepository, pushService } = buildService();
    remindersRepository.findDuePending.mockResolvedValueOnce([
      {
        id: 'rem_1',
        tenantId: 'tenant_1',
        channel: ReminderChannel.PUSH,
        message: 'Payment due',
      },
    ]);

    await service.dispatchDue();

    expect(pushService.sendToTokens).toHaveBeenCalledWith(
      ['ExponentPushToken[abc]'],
      'Recordatorio de pago',
      'Payment due',
      { type: undefined, id: undefined },
    );
    expect(remindersRepository.claim).toHaveBeenCalledWith('rem_1', 'SENT');
  });

  it('dispatches due email reminders to each owner and marks them sent', async () => {
    const { service, remindersRepository, emailService } = buildService();
    remindersRepository.findDuePending.mockResolvedValueOnce([
      {
        id: 'rem_2',
        tenantId: 'tenant_1',
        channel: ReminderChannel.EMAIL,
        message: 'Payment due',
      },
    ]);

    await service.dispatchDue();

    expect(emailService.send).toHaveBeenCalledWith(
      'owner@example.com',
      'Recordatorio de pago',
      'Payment due',
    );
    expect(remindersRepository.claim).toHaveBeenCalledWith('rem_2', 'SENT');
  });

  it('fetches owners once per tenant, not once per reminder', async () => {
    const { service, remindersRepository, usersRepository } = buildService();
    remindersRepository.findDuePending.mockResolvedValueOnce([
      {
        id: 'rem_1',
        tenantId: 'tenant_1',
        channel: ReminderChannel.PUSH,
        message: 'Payment due 1',
      },
      {
        id: 'rem_2',
        tenantId: 'tenant_1',
        channel: ReminderChannel.EMAIL,
        message: 'Payment due 2',
      },
      {
        id: 'rem_3',
        tenantId: 'tenant_2',
        channel: ReminderChannel.PUSH,
        message: 'Payment due 3',
      },
    ]);

    await service.dispatchDue();

    expect(usersRepository.findOwnersWithPushTokens).toHaveBeenCalledTimes(2);
    expect(remindersRepository.claim).toHaveBeenCalledTimes(3);
  });

  it('skips a reminder another instance already claimed', async () => {
    const { service, remindersRepository, pushService } = buildService();
    remindersRepository.findDuePending.mockResolvedValueOnce([
      {
        id: 'rem_9',
        tenantId: 'tenant_1',
        relatedType: ReminderRelatedType.INVOICE,
        relatedId: 'inv_1',
        channel: ReminderChannel.PUSH,
        message: 'Payment due',
      },
    ]);
    remindersRepository.claim.mockResolvedValueOnce(false);

    await service.dispatchDue();

    expect(pushService.sendToTokens).not.toHaveBeenCalled();
  });

  it('dismisses instead of sending reminders of invoices already paid or cancelled', async () => {
    const { service, remindersRepository, pushService } = buildService();
    remindersRepository.findDuePending.mockResolvedValueOnce([
      {
        id: 'rem_7',
        tenantId: 'tenant_1',
        relatedType: ReminderRelatedType.INVOICE,
        relatedId: 'inv_paid',
        channel: ReminderChannel.PUSH,
        message: 'Payment due',
      },
    ]);
    remindersRepository.findClosedInvoiceIds.mockResolvedValueOnce(
      new Set(['inv_paid']),
    );

    await service.dispatchDue();

    expect(remindersRepository.claim).toHaveBeenCalledWith(
      'rem_7',
      'DISMISSED',
    );
    expect(pushService.sendToTokens).not.toHaveBeenCalled();
  });

  it('puts a reminder back to PENDING for the next tick if dispatch fails', async () => {
    const { service, remindersRepository, pushService } = buildService();
    remindersRepository.findDuePending.mockResolvedValueOnce([
      {
        id: 'rem_3',
        tenantId: 'tenant_1',
        channel: ReminderChannel.PUSH,
        message: 'Payment due',
      },
    ]);
    pushService.sendToTokens.mockRejectedValueOnce(
      new Error('Expo unreachable'),
    );

    await service.dispatchDue();

    expect(remindersRepository.release).toHaveBeenCalledWith('rem_3');
  });
});
