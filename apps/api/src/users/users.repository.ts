import { Injectable } from '@nestjs/common';
import { Platform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantDb: TenantPrismaService,
  ) {}

  /** Pre-auth (login): no tenant context yet — stays on the owner connection. */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findOwnersWithPushTokens(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.user.findMany({
        where: { tenantId, role: 'OWNER' },
        include: { pushTokens: true },
      }),
    );
  }

  upsertPushToken(
    tenantId: string,
    userId: string,
    token: string,
    platform: Platform,
  ) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.pushToken.upsert({
        where: { token },
        create: { tenantId, userId, token, platform },
        update: { tenantId, userId, platform },
      }),
    );
  }
}
