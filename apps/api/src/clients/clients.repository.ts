import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsRepository {
  constructor(private readonly tenantDb: TenantPrismaService) {}

  create(tenantId: string, dto: CreateClientDto) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.client.create({ data: { ...dto, tenantId } }),
    );
  }

  findAll(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.client.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  findOne(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.client.findFirst({ where: { id, tenantId } }),
    );
  }

  update(tenantId: string, id: string, dto: UpdateClientDto) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.client.update({ where: { id }, data: dto }),
    );
  }

  remove(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.client.delete({ where: { id } }),
    );
  }
}
