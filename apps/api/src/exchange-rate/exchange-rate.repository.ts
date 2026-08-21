import { Injectable } from '@nestjs/common';
import { ExchangeRateSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExchangeRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(source: ExchangeRateSource, rate: number) {
    return this.prisma.exchangeRate.upsert({
      where: { source },
      create: { source, rate },
      update: { rate, fetchedAt: new Date() },
    });
  }

  findAll() {
    return this.prisma.exchangeRate.findMany();
  }
}
