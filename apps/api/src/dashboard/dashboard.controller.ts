import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Prisma } from '@prisma/client';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { DashboardRepository } from './dashboard.repository';

const toMoney = (
  rows: { currency: string; amount: { toString(): string } }[],
) =>
  rows.map((r) => ({
    currency: r.currency,
    amount: new Prisma.Decimal(r.amount.toString()).toFixed(2),
  }));

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  @Get('summary')
  async summary(@CurrentTenant() tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const data = await this.dashboardRepository.summary(
      tenantId,
      monthStart,
      now,
      weekEnd,
    );
    return {
      collectedThisMonth: toMoney(data.collected),
      outstanding: toMoney(data.outstanding),
      openInvoices: data.openInvoices,
      overdueInvoices: data.overdueInvoices,
      bookingsThisWeek: data.bookingsThisWeek,
      nextBookings: data.nextBookings.map((b) => ({
        id: b.id,
        title: b.title,
        scheduledAt: b.scheduledAt,
        status: b.status,
        clientName: b.client.name,
      })),
    };
  }
}
