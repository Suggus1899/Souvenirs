import { ExchangeRateSource } from '@prisma/client';
import { ExchangeRateService } from './exchange-rate.service';

describe('ExchangeRateService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function buildService() {
    const exchangeRateRepository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
    };
    const service = new ExchangeRateService(exchangeRateRepository as never);
    return { service, exchangeRateRepository };
  }

  it('refreshes both oficial and paralelo rates on a successful fetch', async () => {
    const { service, exchangeRateRepository } = buildService();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { fuente: 'oficial', promedio: 100.5 },
          { fuente: 'paralelo', promedio: 150.25 },
        ]),
    });

    await service.refresh();

    expect(exchangeRateRepository.upsert).toHaveBeenCalledWith(
      ExchangeRateSource.BCV,
      100.5,
    );
    expect(exchangeRateRepository.upsert).toHaveBeenCalledWith(
      ExchangeRateSource.PARALELO,
      150.25,
    );
  });

  it('keeps the cached rate and does not throw if the external API fails', async () => {
    const { service, exchangeRateRepository } = buildService();
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    await expect(service.refresh()).resolves.toBeUndefined();
    expect(exchangeRateRepository.upsert).not.toHaveBeenCalled();
  });

  it('findAll returns null for a source with no cached rate yet', async () => {
    const { service, exchangeRateRepository } = buildService();
    exchangeRateRepository.findAll.mockResolvedValue([
      { source: ExchangeRateSource.BCV, rate: 100 },
    ]);

    const result = await service.findAll();

    expect(result.oficial).toEqual({
      source: ExchangeRateSource.BCV,
      rate: 100,
    });
    expect(result.paralelo).toBeNull();
  });
});
