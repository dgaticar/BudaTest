const { getMarkets, getTicker } = require('./budaClient');

const FIATS = ['CLP', 'PEN', 'COP'];

async function findBestConversions({ from, to, amount }) {
  from = from.toUpperCase();
  to = to.toUpperCase();
  console.log(`\n=== findBestConversions called ===`);
  console.log('Input:', { from, to, amount });

  if (!FIATS.includes(from) || !FIATS.includes(to))
    throw { status: 400, message: 'from/to must be one of CLP,PEN,COP' };

  // Caso especial: misma divisa
  if (from === to) {
    console.log('From y To son iguales, retornando conversion directa');
    return [{
      amount_out: amount,
      intermediary: null,
      price1: 1,
      price2: 1
    }];
  }

  console.log('Fetching markets from Buda...');
  const markets = await getMarkets();
  console.log('Total markets fetched:', markets.length);

  const marketMap = {};
  await Promise.all(
    markets.map(async (m) => {
      try {
        const ticker = await getTicker(m.id);
        const price = parseFloat(ticker.last_price);
        if (!price) return;
        marketMap[m.id.toUpperCase()] = price;
        const [base, quote] = m.id.split('-');
        const inverseId = `${quote.toUpperCase()}-${base.toUpperCase()}`;
        marketMap[inverseId] = 1 / price;
      } catch (err) {
        console.log(`Error fetching ticker for ${m.id}:`, err.message || err);
      }
    })
  );

  const cryptos = new Set();
  Object.keys(marketMap).forEach(mid => {
    const [base, quote] = mid.split('-');
    if (FIATS.includes(quote.toUpperCase())) cryptos.add(base.toUpperCase());
  });

  console.log('Potential crypto intermediaries:', Array.from(cryptos));

  const results = [];

  for (const crypto of cryptos) {
    const m1 = `${crypto}-${from}`;
    const m2 = `${crypto}-${to}`;

    const price1 = marketMap[m1];
    const price2 = marketMap[m2];

    if (!price1 || !price2) {
      console.log(`Skipping crypto ${crypto}: missing market for conversion`);
      continue;
    }

    const cryptoAmount = amount / price1;
    const amountOut = cryptoAmount * price2;

    console.log(`Crypto ${crypto}: amount_out = ${amountOut.toFixed(2)}`);

    results.push({
      amount_out: amountOut,
      intermediary: crypto.toLowerCase(),
      price1,
      price2
    });
  }

  if (results.length === 0) {
    console.log('No intermediary found.');
    throw { status: 422, message: 'No intermediary found for requested conversion' };
  }

  results.sort((a, b) => b.amount_out - a.amount_out);
  const top3 = results.slice(0, 3);
  console.log('Top 3 conversions:', top3);
  return top3;
}

module.exports = { findBestConversions };
