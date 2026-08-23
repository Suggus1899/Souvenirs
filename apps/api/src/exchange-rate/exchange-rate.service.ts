import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeRateSource } from '@prisma/client';
import { ExchangeRateRepository } from './exchange-rate.repository';

interface DolarApiEntry {
  fuente: 'oficial' | 'paralelo';
  promedio: number;
}

const SOURCE_BY_FUENTE: Record<DolarApiEntry['fuente'], ExchangeRateSource> = {
  oficial: ExchangeRateSource.BCV,
  paralelo: ExchangeRateSource.PARALELO,
};

function isDolarApiEntry(value: unknown): value is DolarApiEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { fuente, promedio } = value as Record<string, unknown>;
  return (
    (fuente === 'oficial' || fuente === 'paralelo') &&
    typeof promedio === 'number' &&
    Number.isFinite(promedio) &&
    promedio > 0
  );
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    private readonly exchangeRateRepository: ExchangeRateRepository,
  ) {}

  async findAll() {
    const rates = await this.exchangeRateRepository.findAll();
    return {
      oficial: rates.find((r) => r.source === ExchangeRateSource.BCV) ?? null,
      paralelo:
        rates.find((r) => r.source === ExchangeRateSource.PARALELO) ?? null,
    };
  }

  @Cron(CronExpression.EVERY_5_HOURS)
  async refresh() {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares');
      if (!res.ok) {
        throw new Error(`dolarapi responded with ${res.status}`);
      }
      const body: unknown = await res.json();
      if (!Array.isArray(body)) {
        throw new Error('dolarapi response is not an array');
      }
      const entries = body.filter(isDolarApiEntry);
      if (entries.length === 0) {
        throw new Error('dolarapi response contained no valid entries');
      }

      await Promise.all(
        entries.map((entry) =>
          this.exchangeRateRepository.upsert(
            SOURCE_BY_FUENTE[entry.fuente],
            entry.promedio,
          ),
        ),
      );
    } catch (error) {
      // Best-effort: keep serving the last cached rate rather than breaking invoice pages.
      this.logger.error('Failed to refresh USD/VES exchange rate', error);
    }
  }
}
