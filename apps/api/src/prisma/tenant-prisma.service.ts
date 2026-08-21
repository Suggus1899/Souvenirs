import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Runs tenant-scoped queries against the `app_runtime` role (subject to Postgres RLS),
 * never against the table-owner connection. Each call wraps the query in a transaction
 * that sets `app.tenant_id` via `SET LOCAL` — Postgres only honors that setting within
 * the same transaction, so plain pooled queries can't use it.
 */
@Injectable()
export class TenantPrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor(configService: ConfigService) {
    this.client = new PrismaClient({
      datasources: {
        db: { url: configService.getOrThrow<string>('DATABASE_URL_RUNTIME') },
      },
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  run<T>(
    tenantId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    });
  }
}
