import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface AuthResponseBody {
  accessToken: string;
}

interface EntityBody {
  id: string;
  status?: string;
}

async function registerTenant(app: INestApplication<App>, tag: string) {
  const email = `e2e-domain-${tag}-${Date.now()}@example.com`;
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      tenantName: `Studio ${tag}`,
      name: `Owner ${tag}`,
      email,
      password: 'password123',
    })
    .expect(201);
  const body = res.body as AuthResponseBody & { user: { tenantId: string } };
  return { token: body.accessToken, tenantId: body.user.tenantId, email };
}

describe('Domain (e2e): clients, bookings, invoices, payments', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantA: Awaited<ReturnType<typeof registerTenant>>;
  let tenantB: Awaited<ReturnType<typeof registerTenant>>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    tenantA = await registerTenant(app, 'A');
    tenantB = await registerTenant(app, 'B');
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantA.tenantId, tenantB.tenantId] } },
    });
    await app.close();
  });

  it('creates a client, service and booking for tenant A', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'Jane Doe', email: 'jane@example.com' })
      .expect(201);
    const client = clientRes.body as EntityBody;

    const serviceRes = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'Wedding shoot', basePrice: 100, durationMinutes: 120 })
      .expect(201);
    const service = serviceRes.body as EntityBody;

    const bookingRes = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({
        clientId: client.id,
        serviceId: service.id,
        title: 'Jane wedding',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 120,
      })
      .expect(201);
    const booking = bookingRes.body as EntityBody;

    expect(booking.status).toBe('PENDING');
  });

  it('does not let tenant B see or reference tenant A data', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'Cross Tenant Client' })
      .expect(201);
    const client = clientRes.body as EntityBody;

    await request(app.getHttpServer())
      .get(`/clients/${client.id}`)
      .set('Authorization', `Bearer ${tenantB.token}`)
      .expect(404);

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${tenantB.token}`)
      .send({
        clientId: client.id,
        title: 'Should fail',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
      })
      .expect(404);
  });

  it('moves an invoice through PARTIAL to PAID as payments are registered', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'Paying Client' })
      .expect(201);
    const client = clientRes.body as EntityBody;

    const invoiceRes = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ clientId: client.id, totalAmount: 100 })
      .expect(201);
    const invoice = invoiceRes.body as EntityBody;
    expect(invoice.status).toBe('DRAFT');

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ invoiceId: invoice.id, amount: 40, method: 'CASH' })
      .expect(201);

    const afterPartialRes = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .expect(200);
    expect((afterPartialRes.body as EntityBody).status).toBe('PARTIAL');

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ invoiceId: invoice.id, amount: 60, method: 'TRANSFER' })
      .expect(201);

    const afterFullRes = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .expect(200);
    expect((afterFullRes.body as EntityBody).status).toBe('PAID');

    // Once paid, direct edits are rejected
    await request(app.getHttpServer())
      .patch(`/invoices/${invoice.id}`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ totalAmount: 999 })
      .expect(400);
  });

  it('rejects payments on a cancelled invoice', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'Cancelled Flow Client' })
      .expect(201);
    const client = clientRes.body as EntityBody;

    const invoiceRes = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ clientId: client.id, totalAmount: 50 })
      .expect(201);
    const invoice = invoiceRes.body as EntityBody;

    await request(app.getHttpServer())
      .post(`/invoices/${invoice.id}/cancel`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ invoiceId: invoice.id, amount: 50, method: 'CASH' })
      .expect(400);
  });

  it('accepts Venezuelan manual payment methods and moves the invoice to PAID', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'Pago Móvil Client' })
      .expect(201);
    const client = clientRes.body as EntityBody;

    const invoiceRes = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ clientId: client.id, totalAmount: 30 })
      .expect(201);
    const invoice = invoiceRes.body as EntityBody;

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ invoiceId: invoice.id, amount: 30, method: 'PAGO_MOVIL' })
      .expect(201);

    const afterPaymentRes = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .expect(200);
    expect((afterPaymentRes.body as EntityBody).status).toBe('PAID');
  });
});
