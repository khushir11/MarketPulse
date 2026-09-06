const stocks = {
  NVDA: { companyName: 'NVIDIA Corporation', price: 178.42, volume: 42200000, averageVolume: 15600000, dayChange: 4.2 },
  AAPL: { companyName: 'Apple Inc.', price: 237.42, volume: 61500000, averageVolume: 40200000, dayChange: 1.2 },
  MSFT: { companyName: 'Microsoft Corporation', price: 502.31, volume: 17800000, averageVolume: 19100000, dayChange: 0.4 },
  TSLA: { companyName: 'Tesla, Inc.', price: 349.98, volume: 98700000, averageVolume: 75100000, dayChange: -2.8 },
  AMZN: { companyName: 'Amazon.com, Inc.', price: 226.12, volume: 31900000, averageVolume: 33600000, dayChange: 0.8 }
};
const scenarioAdjustments = {
  calm: { price: 0.3, volume: 1, news: 0 }, rise: { price: 5.8, volume: 2.7, news: 3 },
  fall: { price: -4.7, volume: 2.2, news: 3 }, volume: { price: 1.1, volume: 2.4, news: 1 },
  news: { price: 2.1, volume: 1.4, news: 3 }, outage: { price: 0, volume: 1, news: 0, stale: true }
};
export const catalog = Object.entries(stocks).map(([symbol, data]) => ({ symbol, ...data }));
export function findStocks(query = '') { const q = query.toUpperCase(); return catalog.filter(s => s.symbol.includes(q) || s.companyName.toUpperCase().includes(q)); }
export function getQuote(symbol, scenario = 'calm') {
  const base = stocks[symbol.toUpperCase()]; if (!base) return null;
  const a = scenarioAdjustments[scenario] || scenarioAdjustments.calm;
  const price = +(base.price * (1 + a.price / 100)).toFixed(2);
  return { symbol: symbol.toUpperCase(), companyName: base.companyName, price, volume: Math.round(base.averageVolume * a.volume), averageVolume: base.averageVolume, dayChange: a.price, timestamp: new Date().toISOString(), source: a.stale ? 'Last known mock quote' : 'MarketPulse Mock Market', status: a.stale ? 'stale' : 'fresh' };
}
export function getHistory(symbol, scenario) { const q = getQuote(symbol, scenario); if (!q) return null; return Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, price: +(q.price * (0.96 + i * .003 + ((i % 3) - 1) * .004)).toFixed(2) })); }
export function scenarioInfo(name) { return scenarioAdjustments[name] || scenarioAdjustments.calm; }
