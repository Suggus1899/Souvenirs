import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TenantPrismaService } from './../src/prisma/tenant-prisma.service';

describe('Row Level Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantDb: TenantPrismaService;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    tenantDb = app.get(TenantPrismaService);

    const tenant = await prisma.tenant.create({
      data: {
        name: 'RLS Test Tenant',
        users: {
          create: {
            name: 'RLS Owner',
            email: `rls-${Date.now()}@example.com`,
            passwordHash: 'x',
            role: 'OWNER',
          },
        },
      },
    });
    tenantId = tenant.id;
    await prisma.client.create({ data: { tenantId, name: 'RLS Test Client' } });
  });

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } });
    await app.close();
  });

  it('a raw app_runtime connection with no tenant context set sees nothing, even for real data', async () => {
    const rawClient = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL_RUNTIME } },
    });
    try {
      const clients = await rawClient.client.findMany({ where: { tenantId } });
      expect(clients).toHaveLength(0);
    } finally {
      await rawClient.$disconnect();
    }
  });

  it('TenantPrismaService scoped to the correct tenant sees its own data', async () => {
    const clients = await tenantDb.run(tenantId, (tx) =>
      tx.client.findMany({ where: { tenantId } }),
    );
    expect(clients.length).toBeGreaterThan(0);
  });

  it('a different tenant context cannot see this tenant data even via an explicit matching WHERE', async () => {
    const clients = await tenantDb.run('some-other-tenant-id', (tx) =>
      tx.client.findMany({ where: { tenantId } }),
    );
    expect(clients).toHaveLength(0);
  });
});
