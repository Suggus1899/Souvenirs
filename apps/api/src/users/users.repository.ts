import { Injectable } from '@nestjs/common';
import { Platform, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';

const TEAM_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantDb: TenantPrismaService,
  ) {}

  /**
   * Pre-auth (login): no tenant context yet — stays on the owner connection.
   * Case-insensitive: new accounts are stored lowercased, but older rows may not be.
   */
  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  findById(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.user.findFirst({ where: { id, tenantId } }),
    );
  }

  listTeam(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.user.findMany({
        where: { tenantId },
        select: TEAM_MEMBER_SELECT,
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  createMember(
    tenantId: string,
    input: { name: string; email: string; passwordHash: string; role: Role },
  ) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.user.create({
        data: { ...input, tenantId },
        select: TEAM_MEMBER_SELECT,
      }),
    );
  }

  updateProfile(tenantId: string, id: string, name: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.user.update({
        where: { id },
        data: { name },
        select: TEAM_MEMBER_SELECT,
      }),
    );
  }

  updatePasswordHash(tenantId: string, id: string, passwordHash: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.user.update({ where: { id }, data: { passwordHash } }),
    );
  }

  remove(tenantId: string, id: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.user.delete({ where: { id } }),
    );
  }

  deletePushToken(tenantId: string, userId: string, token: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.pushToken.deleteMany({ where: { tenantId, userId, token } }),
    );
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
