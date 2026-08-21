import { Injectable } from '@nestjs/common';
import { Platform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findOwnersWithPushTokens(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, role: 'OWNER' },
      include: { pushTokens: true },
    });
  }

  upsertPushToken(
    tenantId: string,
    userId: string,
    token: string,
    platform: Platform,
  ) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { tenantId, userId, token, platform },
      update: { tenantId, userId, platform },
    });
  }
}
