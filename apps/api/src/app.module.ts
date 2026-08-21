import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ClientsModule } from './clients/clients.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { RemindersModule } from './reminders/reminders.module';
import { ServicesModule } from './services/services.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ClientsModule,
    ServicesModule,
    BookingsModule,
    InvoicesModule,
    PaymentsModule,
    RemindersModule,
    ExchangeRateModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
