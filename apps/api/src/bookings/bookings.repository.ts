import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  create(tenantId: string, createdById: string, dto: CreateBookingDto) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.create({
        data: {
          ...dto,
          scheduledAt: new Date(dto.scheduledAt),
          tenantId,
          createdById,
        },
      }),
    );
  }

  findAll(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.findMany({
        where: { tenantId },
        orderBy: { scheduledAt: 'asc' },
      }),
    );
  }

  findOne(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.booking.findFirst({ where: { id, tenantId } }),
    );
  }

  update(tenantId: string, id: string, dto: UpdateBookingDto) {
    const { scheduledAt, ...rest } = dto;
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
