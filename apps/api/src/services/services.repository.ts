import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  create(tenantId: string, dto: CreateServiceDto) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.service.create({ data: { ...dto, tenantId } }),
    );
  }

  findAll(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.service.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    );
  }

  findOne(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.service.findFirst({ where: { id, tenantId } }),
    );
  }

  update(tenantId: string, id: string, dto: UpdateServiceDto) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.service.update({ where: { id }, data: dto }),
    );
  }

  remove(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.service.delete({ where: { id } }),
    );
  }
}
