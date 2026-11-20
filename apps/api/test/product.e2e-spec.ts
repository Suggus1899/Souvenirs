/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call --
   supertest response bodies are untyped JSON; these assertions are what check their shape. */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EmailService } from './../src/notifications/email.service';
import { PrismaService } from './../src/prisma/prisma.service';
import { InvoicesService } from './../src/invoices/invoices.service';

interface Sent {
  to: string;
  subject: string;
  text: string;
}

describe('Product flows (e2e): invoices, public page, team, password reset', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const outbox: Sent[] = [];
  const tag = Date.now();
  const ownerEmail = `e2e-product-${tag}@example.com`;
  let token: string;
  let tenantId: string;
  let clientId: string;

  const api = () => request(app.getHttpServer());
  const auth = (req: request.Test) =>
    req.set('Authorization', `Bearer ${token}`);
  const linkToken = (text: string) => /token=([\w-]+)/.exec(text)?.[1];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: (to: string, subject: string, text: string) => {
          outbox.push({ to, subject, text });
          return Promise.resolve();
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const res = await api()
      .post('/auth/register')
      .send({
        tenantName: 'Estudio Luz',
        name: 'Dueña',
        email: ownerEmail,
        password: 'password123',
      })
      .expect(201);
    token = res.body.accessToken;
    tenantId = res.body.user.tenantId;

    const client = await auth(api().post('/clients'))
      .send({ name: 'Ana Pérez', email: `ana-${tag}@example.com` })
      .expect(201);
    clientId = client.body.id;
  });

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } });
    await app.close();
  });

  it('numbers invoices per tenant and computes the total from line items', async () => {
    const first = await auth(api().post('/invoices'))
      .send({
        clientId,
        items: [
          { description: 'Sesión de fotos', quantity: 1, unitPrice: 150 },
          { description: 'Copias impresas', quantity: 3, unitPrice: 12.5 },
        ],
      })
      .expect(201);
    expect(first.body.number).toBe(1);
    expect(first.body.totalAmount).toBe('187.5');
    expect(first.body.items).toHaveLength(2);

    const second = await auth(api().post('/invoices'))
      .send({ clientId, totalAmount: 50 })
      .expect(201);
    expect(second.body.number).toBe(2);
  });

  it('rejects an invoice with neither items nor a total', async () => {
    await auth(api().post('/invoices')).send({ clientId }).expect(400);
  });

  it('sends the invoice by email, schedules reminders and exposes the public page', async () => {
    const created = await auth(api().post('/invoices'))
      .send({
        clientId,
        totalAmount: 100,
        dueDate: new Date(Date.now() + 10 * 86_400_000).toISOString(),
      })
      .expect(201);
    const id = created.body.id;
    const publicToken = created.body.publicToken;

    // Drafts are invisible from the outside.
    await api().get(`/public/invoices/${publicToken}`).expect(404);

    await auth(api().post(`/invoices/${id}/send`)).expect(201);
    const email = outbox.find((m) =>
      m.subject.includes(`#${created.body.number}`),
    );
    expect(email?.text).toContain(`/pay/${publicToken}`);

    const reminders = await prisma.reminder.findMany({
      where: { relatedId: id },
    });
    expect(reminders.some((r) => r.recipient === 'CLIENT')).toBe(true);

    const page = await api().get(`/public/invoices/${publicToken}`).expect(200);
    expect(page.body).toMatchObject({
      studioName: 'Estudio Luz',
      clientName: 'Ana Pérez',
      balance: '100.00',
      canPayOnline: false,
    });
    expect(page.body).not.toHaveProperty('tenantId');

    // Paying it off dismisses the pending reminders.
    await auth(api().post('/payments'))
      .send({ invoiceId: id, amount: 100, method: 'ZELLE' })
      .expect(201);
    const after = await prisma.reminder.findMany({ where: { relatedId: id } });
    expect(after.every((r) => r.status === 'DISMISSED')).toBe(true);
  });

  it('refuses a manual payment above the remaining balance', async () => {
    const created = await auth(api().post('/invoices'))
      .send({ clientId, totalAmount: 80 })
      .expect(201);
    await auth(api().post(`/invoices/${created.body.id}/send`)).expect(201);
    await auth(api().post('/payments'))
      .send({ invoiceId: created.body.id, amount: 50, method: 'CASH' })
      .expect(201);
    await auth(api().post('/payments'))
      .send({ invoiceId: created.body.id, amount: 30.01, method: 'CASH' })
      .expect(400);
  });

  it('marks invoices overdue once their due day has passed', async () => {
    const created = await auth(api().post('/invoices'))
      .send({
        clientId,
        totalAmount: 20,
        dueDate: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      })
      .expect(201);
    await auth(api().post(`/invoices/${created.body.id}/send`)).expect(201);

    await app.get(InvoicesService).markOverdue();

    const res = await auth(api().get(`/invoices/${created.body.id}`)).expect(
      200,
    );
    expect(res.body.status).toBe('OVERDUE');
    const filtered = await auth(api().get('/invoices?status=OVERDUE')).expect(
      200,
    );
    expect(filtered.body.map((i: { id: string }) => i.id)).toContain(
      created.body.id,
    );
  });

  it('exports invoices as CSV', async () => {
    const res = await auth(api().get('/invoices/export')).expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('numero,cliente,estado');
    expect(res.text).toContain('Ana Pérez');
  });

  it('returns dashboard totals grouped by currency', async () => {
    const res = await auth(api().get('/dashboard/summary')).expect(200);
    expect(res.body.collectedThisMonth).toEqual([
      { currency: 'USD', amount: '150.00' },
    ]);
    expect(res.body.overdueInvoices).toBeGreaterThanOrEqual(1);
  });

  it('blocks overlapping bookings unless explicitly allowed', async () => {
    const start = new Date(Date.now() + 5 * 86_400_000);
    const booking = { clientId, title: 'Sesión', durationMinutes: 120 };
    await auth(api().post('/bookings'))
      .send({ ...booking, scheduledAt: start.toISOString() })
      .expect(201);
    const overlapping = new Date(start.getTime() + 60 * 60_000).toISOString();
    await auth(api().post('/bookings'))
      .send({ ...booking, scheduledAt: overlapping })
      .expect(409);
    await auth(api().post('/bookings'))
      .send({ ...booking, scheduledAt: overlapping, allowOverlap: true })
      .expect(201);
  });

  it('invites an assistant who sets a password from the email link and has limited rights', async () => {
    const assistantEmail = `asistente-${tag}@example.com`;
    await auth(api().post('/users/invitations'))
      .send({ name: 'Asistente', email: assistantEmail })
      .expect(201);
    const invite = outbox.find((m) => m.to === assistantEmail);
    const inviteToken = linkToken(invite!.text);
    expect(invite!.text).toContain('invite=1');

    const accepted = await api()
      .post('/auth/reset-password')
      .send({ token: inviteToken, password: 'asistente123' })
      .expect(200);
    expect(accepted.body.user.role).toBe('ASSISTANT');
    const assistantToken = accepted.body.accessToken;

    // One-time link.
    await api()
      .post('/auth/reset-password')
      .send({ token: inviteToken, password: 'otra-clave-123' })
      .expect(400);

    await api()
      .get('/clients')
      .set('Authorization', `Bearer ${assistantToken}`)
      .expect(200);
    await api()
      .patch('/tenants/me')
      .set('Authorization', `Bearer ${assistantToken}`)
      .send({ name: 'Hackeado' })
      .expect(403);
    await api()
      .post('/users/invitations')
      .set('Authorization', `Bearer ${assistantToken}`)
      .send({ name: 'X', email: `x-${tag}@example.com` })
      .expect(403);

    const team = await auth(api().get('/users')).expect(200);
    expect(team.body).toHaveLength(2);
    expect(team.body[0]).not.toHaveProperty('passwordHash');

    // Removing the member revokes their still-unexpired token right away.
    const assistantId = team.body.find(
      (m: { role: string }) => m.role === 'ASSISTANT',
    ).id;
    await auth(api().delete(`/users/${assistantId}`)).expect(204);
    await api()
      .get('/clients')
      .set('Authorization', `Bearer ${assistantToken}`)
      .expect(401);
  });

  it('resets a forgotten password and answers the same for unknown emails', async () => {
    await api()
      .post('/auth/forgot-password')
      .send({ email: 'nadie@example.com' })
      .expect(204);
    await api()
      .post('/auth/forgot-password')
      .send({ email: ownerEmail.toUpperCase() })
      .expect(204);

    // The email goes out in the background.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mail = outbox.find(
      (m) => m.to === ownerEmail && m.subject.includes('Restablece'),
    );
    expect(mail).toBeDefined();

    await api()
      .post('/auth/reset-password')
      .send({ token: linkToken(mail!.text), password: 'nueva-clave-123' })
      .expect(200);
    await api()
      .post('/auth/login')
      .send({ email: ownerEmail, password: 'nueva-clave-123' })
      .expect(200);
  });

  it('updates reminder preferences (owner only)', async () => {
    const res = await auth(api().patch('/tenants/me'))
      .send({ reminderOffsetsDays: [2, -1], clientRemindersEnabled: false })
      .expect(200);
    expect(res.body.reminderOffsetsDays).toEqual([-1, 2]);
    await auth(api().patch('/tenants/me'))
      .send({ reminderOffsetsDays: [90] })
      .expect(400);
  });
});
