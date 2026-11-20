import { InvoiceStatus, Prisma } from '@prisma/client';
import { isPastDue, statusAfterPayment } from './invoice-status';

const d = (v: number | string) => new Prisma.Decimal(v);
const now = new Date('2026-11-20T12:00:00Z');

describe('invoice-status', () => {
  it('is PAID once the paid total reaches the invoice total', () => {
    expect(
      statusAfterPayment({ totalAmount: d(100), dueDate: null }, d(100), now),
    ).toBe(InvoiceStatus.PAID);
  });

  it('is PARTIAL for a partial payment before the due date', () => {
    expect(
      statusAfterPayment(
        { totalAmount: d(100), dueDate: new Date('2026-12-01') },
        d(40),
        now,
      ),
    ).toBe(InvoiceStatus.PARTIAL);
  });

  it('stays OVERDUE for a partial payment after the due date', () => {
    expect(
      statusAfterPayment(
        { totalAmount: d(100), dueDate: new Date('2026-11-01') },
        d(40),
        now,
      ),
    ).toBe(InvoiceStatus.OVERDUE);
  });

  it('does not treat the due day itself as overdue', () => {
    expect(isPastDue(new Date('2026-11-20T00:00:00Z'), now)).toBe(false);
    expect(isPastDue(new Date('2026-11-19T00:00:00Z'), now)).toBe(true);
  });
});
