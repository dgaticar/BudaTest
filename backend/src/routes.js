const express = require('express');
const router = express.Router();
const { findBestConversions } = require('./converter');
const { getMarkets, getTicker } = require('./budaClient');
const { detectArbitrage } = require('./arbitrage');

router.post('/convert', async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    if (!from || !to || typeof amount !== 'number')
      return res.status(400).json({ error: 'from,to,amount required (amount as number)' });

    const topConversions = await findBestConversions({ from, to, amount });

    return res.json({
      from,
      to,
      amount,
      top_conversions: topConversions
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
});

router.get('/markets', async (req, res) => {
  try {
    const markets = await getMarkets(); 
    const marketsWithPrice = await Promise.all(
      markets.flatMap(async (m) => {
        const results = [];
        try {
          const ticker = await getTicker(m.id);
          const price = parseFloat(ticker.last_price) || null;
          results.push({ id: m.id, last_price: price });
          const [crypto, fiat] = m.id.split('-');
          results.push({
            id: `${fiat.toUpperCase()}-${crypto.toUpperCase()}`,
            last_price: price ? 1 / price : null
          });
        } catch (err) {
          console.log(`Error obteniendo ticker para ${m.id}:`, err.message || err);
          results.push({ id: m.id, last_price: null });
          const [crypto, fiat] = m.id.split('-');
          results.push({ id: `${fiat.toUpperCase()}-${crypto.toUpperCase()}`, last_price: null });
        }
        return results;
      })
    );

    res.json(marketsWithPrice.flat());
  } catch (err) {
    console.error('Error obteniendo mercados:', err);
    res.status(500).json({ error: 'Error obteniendo mercados' });
  }
});




router.post('/arbitrage-test', async (req, res) => {
  try {
    const { from, amount } = req.body;
    if (!from || typeof amount !== 'number') {
      return res.status(400).json({ error: 'from and amount required' });
    }

    const result = await detectArbitrage(from, amount);
    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;

