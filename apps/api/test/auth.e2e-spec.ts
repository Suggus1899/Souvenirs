import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface AuthResponseBody {
  accessToken: string;
  user: { email: string };
}

interface MeResponseBody {
  userId: string;
  tenantId: string;
  role: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@example.com`;

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('registers a new tenant + owner and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        tenantName: 'E2E Studio',
        name: 'E2E Owner',
        email,
        password: 'password123',
      })
      .expect(201);

    const body = res.body as AuthResponseBody;
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(email);
  });

  it('rejects a duplicate email on register', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        tenantName: 'Other',
        name: 'Other Owner',
        email,
        password: 'password123',
      })
      .expect(409);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    const ok = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    expect((ok.body as AuthResponseBody).accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('protects /auth/me and accepts a valid token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' });
    const { accessToken } = login.body as AuthResponseBody;

    await request(app.getHttpServer()).get('/auth/me').expect(401);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect((me.body as MeResponseBody).tenantId).toBeDefined();
  });
});
