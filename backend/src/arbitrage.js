const { getMarkets, getTicker } = require('./budaClient');

async function detectArbitrage(from, amount, maxSteps = 6, limit = 5) {
  const fromUpper = from.toUpperCase();
  const markets = await getMarkets();
  const rates = {};
  await Promise.all(
    markets.map(async m => {
      try {
        const ticker = await getTicker(m.id);
        const price = parseFloat(ticker.last_price);
        if (!price) return;
        const [base, quote] = m.id.split('-');
        const baseU = base.toUpperCase();
        const quoteU = quote.toUpperCase();
        rates[`${baseU}-${quoteU}`] = price;
        rates[`${quoteU}-${baseU}`] = 1 / price;
      } catch (err) {
        console.log(`Error fetching ticker ${m.id}:`, err.message || err);
      }
    })
  );

  const currencies = Array.from(
    new Set(Object.keys(rates).flatMap(k => k.split('-')))
  );

  const arbitrageCycles = [];

  function findCycles(path, currentAmount) {
    const last = path[path.length - 1];
    if (last === fromUpper && path.length > 1) {
      const profit = currentAmount - amount;
      if (profit > 0) {
        arbitrageCycles.push({
          cycle: [...path],
          finalAmount: Number(currentAmount.toFixed(6)),
          profit: Number(profit.toFixed(6)),
          profitPercentage: Number(
            ((currentAmount / amount - 1) * 100).toFixed(4)
          )
        });
      }
      return;
    }
    if (path.length > maxSteps) return;
    for (const next of currencies) {
      if (next === fromUpper && path.length < 2) continue;
      if (path.includes(next) && next !== fromUpper) continue;
      const rateKey = `${last}-${next}`;
      const rate = rates[rateKey];
      if (!rate) continue;

      findCycles([...path, next], currentAmount * rate);
    }
  }
  findCycles([fromUpper], amount);
  arbitrageCycles.sort((a, b) => b.profit - a.profit);
  const topCycles = arbitrageCycles.slice(0, limit);
  return {
    exists: topCycles.length > 0,
    cycles: topCycles
  };
}

module.exports = { detectArbitrage };
