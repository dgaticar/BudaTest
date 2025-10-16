const { findBestConversions } = require('../src/converter');
const budaClient = require('../src/budaClient');

jest.mock('../src/budaClient');

describe('converter', () => {
  beforeEach(() => jest.resetAllMocks());

  test('computes best intermediary (mock básico)', async () => {
    // Mock de mercados
    budaClient.getMarkets.mockResolvedValue([
      { id: 'btc-clp' },
      { id: 'btc-pen' },
      { id: 'eth-clp' },
      { id: 'eth-pen' }
    ]);

    // Mock de tickers
    budaClient.getTicker.mockImplementation((marketId) => {
      switch (marketId) {
        case 'btc-clp': return Promise.resolve({ last_price: '2000000' });
        case 'btc-pen': return Promise.resolve({ last_price: '70000' });
        case 'eth-clp': return Promise.resolve({ last_price: '100000' });
        case 'eth-pen': return Promise.resolve({ last_price: '3500' });
        default: return Promise.reject(new Error('not found'));
      }
    });

    const outArray = await findBestConversions({ from: 'CLP', to: 'PEN', amount: 1000000 });

    // Debe devolver un array de hasta 3 mejores conversiones
    expect(outArray.length).toBeGreaterThan(0);

    // Tomamos la mejor
    const best = outArray[0];

    // Verificamos que amount_out sea positivo
    expect(best.amount_out).toBeGreaterThan(0);

    // Verificamos que el intermediario sea BTC o ETH (en mayúsculas)
    expect(['btc', 'eth']).toContain(best.intermediary);

    // Verificamos que los precios coincidan con los mocks
    expect([2000000, 100000]).toContain(best.price1);
    expect([70000, 3500]).toContain(best.price2);
  });
});
