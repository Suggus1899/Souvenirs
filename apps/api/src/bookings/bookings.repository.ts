import { Injectable } from '@nestjs/common';
import { pageArgs } from '../common/pagination-query.dto';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

/** Strips request-only flags that aren't booking columns. */
function withoutFlags<T extends { allowOverlap?: boolean }>(
  dto: T,
): Omit<T, 'allowOverlap'> {
  const copy = { ...dto };
  delete copy.allowOverlap;
  return copy;
}

@Injectable()
export class BookingsRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  create(tenantId: string, createdById: string, dto: CreateBookingDto) {
    const data = withoutFlags(dto);
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.create({
        data: {
          ...data,
          scheduledAt: new Date(dto.scheduledAt),
          tenantId,
          createdById,
        },
      }),
    );
  }

  findAll(tenantId: string, query: ListBookingsQueryDto = {}) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.findMany({
        where: {
          tenantId,
          ...(query.clientId ? { clientId: query.clientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.from || query.to
            ? {
                scheduledAt: {
                  ...(query.from ? { gte: new Date(query.from) } : {}),
                  ...(query.to ? { lt: new Date(query.to) } : {}),
                },
              }
            : {}),
        },
        orderBy: { scheduledAt: 'asc' },
        ...pageArgs(query),
      }),
    );
  }

  /** Id of a non-cancelled booking whose time range intersects [start, end), if any. */
  async findOverlapping(
    tenantId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<string | null> {
    const rows = await this.tenantDb.run(
      tenantId,
      (tx) => tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "bookings"
        WHERE "tenantId" = ${tenantId}
          AND "status" <> 'CANCELLED'
          AND "id" <> ${excludeId ?? ''}
          AND "scheduledAt" < ${end}
          AND "scheduledAt" + ("durationMinutes" * INTERVAL '1 minute') > ${start}
        LIMIT 1`,
    );
    return rows[0]?.id ?? null;
  }

  findOne(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.findFirst({ where: { id, tenantId } }),
    );
  }

  update(tenantId: string, id: string, dto: UpdateBookingDto) {
    const { scheduledAt, ...rest } = withoutFlags(dto);
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.update({
        where: { id },
        data: {
          ...rest,
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        },
      }),
    );
  }

  remove(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.delete({ where: { id } }),
    );
  }
}
