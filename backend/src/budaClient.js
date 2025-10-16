const fetch = require('node-fetch');
const BASE = 'https://www.buda.com/api/v2';


async function getMarkets() {
const res = await fetch(`${BASE}/markets`);
const json = await res.json();
return json.markets || json;
}


async function getTicker(marketId) {
const res = await fetch(`${BASE}/markets/${marketId}/ticker.json`);
if (!res.ok) throw new Error(`Ticker fetch failed ${marketId}`);
const json = await res.json();
return json.ticker; 
}


module.exports = { getMarkets, getTicker };