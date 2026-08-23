import { ReminderChannel, ReminderRelatedType } from '@prisma/client';
import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  function buildService() {
    const remindersRepository = {
      create: jest.fn().mockResolvedValue({ id: 'rem_1' }),
      findAll: jest.fn(),
      findDuePending: jest.fn().mockResolvedValue([]),
      markSent: jest.fn().mockResolvedValue(undefined),
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
    const service = new RemindersService(
      remindersRepository as never,
      usersRepository as never,
      pushService as never,
      emailService as never,
    );
    return {
      service,
      remindersRepository,
      usersRepository,
      pushService,
      emailService,
    };
  }

  it('schedules both a push and an email reminder for an invoice due date', async () => {
    const { service, remindersRepository } = buildService();

    await service.createForInvoiceDueDate(
      'tenant_1',
      'inv_1',
      new Date(),
      'Payment due',
    );

    expect(remindersRepository.create).toHaveBeenCalledTimes(2);
    const calls = remindersRepository.create.mock.calls as [
      string,
      { channel: string; relatedType: string },
    ][];
    const channels = calls.map(([, input]) => input.channel);
    expect(channels.sort()).toEqual(
      [ReminderChannel.EMAIL, ReminderChannel.PUSH].sort(),
    );
    expect(calls[0][1].relatedType).toBe(ReminderRelatedType.INVOICE);
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
      'Payment reminder',
      'Payment due',
    );
    expect(remindersRepository.markSent).toHaveBeenCalledWith('rem_1');
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
      'Payment reminder',
      'Payment due',
    );
    expect(remindersRepository.markSent).toHaveBeenCalledWith('rem_2');
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
    expect(remindersRepository.markSent).toHaveBeenCalledTimes(3);
  });

  it('leaves a reminder PENDING for the next tick if dispatch fails', async () => {
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

    expect(remindersRepository.markSent).not.toHaveBeenCalled();
  });
});
