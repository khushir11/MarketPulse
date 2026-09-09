import { readStore, writeStore } from '../services/store.js';
import { getQuote, getHistory } from '../services/marketDataService.js';
import { getNews } from '../services/newsService.js';
import { assessChange } from '../services/meaningfulChangeService.js';

async function build(userId, symbol) {
  const db = await readStore();
  const scenario = db.scenarios[userId] || 'rise';
  const current = getQuote(symbol, scenario);
  if (!current) return null;
  const previous = db.checkpoints
    .filter(p => p.userId === userId && p.symbol === symbol)
    .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))[0];
  const news = getNews(symbol, scenario);
  return {
    ...current,
    ...assessChange({ previous, current, news }),
    news,
    scenario,
    history: getHistory(symbol, scenario)
  };
}

export async function dashboard(req, res) {
  const db = await readStore();
  const rawItems = await Promise.all(
    db.watchlistStocks
      .filter(s => s.userId === req.user.id)
      .map(async stock => {
        const item = await build(req.user.id, stock.symbol);
        return item ? { ...stock, ...item } : null;
      })
  );
  const items = rawItems.filter(Boolean);
  const counts = { 'HIGH ATTENTION': 0, 'WORTH CHECKING': 0, STABLE: 0 };
  items.forEach(x => {
    if (x.status && counts[x.status] !== undefined) counts[x.status]++;
  });
  res.json({ items, counts, generatedAt: new Date().toISOString() });
}

export async function detail(req, res) {
  const item = await build(req.user.id, req.params.symbol.toUpperCase());
  if (!item) return res.status(404).json({ error: 'Stock not found.' });
  res.json(item);
}

export async function checkpoint(req, res) {
  const db = await readStore();
  const watched = db.watchlistStocks.filter(s => s.userId === req.user.id);
  const scenario = db.scenarios[req.user.id] || 'rise';
  watched.forEach(stock => {
    const q = getQuote(stock.symbol, scenario);
    if (q) {
      db.checkpoints.push({
        userId: req.user.id,
        symbol: stock.symbol,
        price: q.price,
        volume: q.volume,
        checkedAt: new Date().toISOString()
      });
    }
  });
  db.checkpoints = db.checkpoints.slice(-300);
  await writeStore(db);
  res.status(201).json({ saved: watched.length, checkedAt: new Date().toISOString() });
}

export async function news(req, res) {
  const db = await readStore();
  res.json(getNews(req.params.symbol.toUpperCase(), db.scenarios[req.user.id] || 'rise'));
}

export async function setScenario(req, res) {
  const allowed = ['calm', 'rise', 'fall', 'volume', 'news', 'outage'];
  if (!allowed.includes(req.body.scenario)) return res.status(400).json({ error: 'Unknown demo scenario.' });
  const db = await readStore();
  db.scenarios[req.user.id] = req.body.scenario;
  await writeStore(db);
  res.json({ scenario: req.body.scenario });
}
