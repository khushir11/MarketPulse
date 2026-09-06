# MarketPulse

MarketPulse is a full-stack stock watchlist that answers **what changed since I last checked, why it matters, and what deserves attention** — not just what a price is.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. Create an account, add one or more of `NVDA`, `AAPL`, `MSFT`, `TSLA`, or `AMZN`, save a checkpoint, select a Demo Mode scenario, then refresh the briefing to compare the new data against that checkpoint.

## Stack and architecture

- React + Vite frontend, responsive CSS, and Recharts for price context
- Node/Express REST API with JWT authentication and bcrypt password hashing
- File-backed development store (`server/data/marketpulse.json`) for a zero-config local demo. Its models map directly to a production PostgreSQL/Prisma schema: Users, WatchlistStocks, UserCheckpoints, MarketSnapshots, and Events.
- Separate market-data, news, checkpoint, and meaningful-change services

## Meaningful-change logic

Thresholds live in `server/services/meaningfulChangeService.js`: price movements over 3% add meaningful weight (5% is high); volume over 2× average adds high weight; impact-scored news adds weight. Scores of 6+ are **High Attention**, 3–5 are **Worth Checking**, and lower scores are **Stable**.

The dashboard calculates the comparison before saving a new checkpoint, preserving the previous visit correctly. Data responses include a source, timestamp, and freshness status. The outage scenario uses last-known data and labels it stale instead of implying that it is live.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- `GET/POST /api/watchlist`, `PATCH/DELETE /api/watchlist/:symbol`, `GET /api/watchlist/search?q=`
- `GET /api/changes`, `GET /api/changes/:symbol`, `POST /api/checkpoint`
- `GET /api/news/:symbol`, `POST /api/demo/scenario`

All watchlist and briefing endpoints require `Authorization: Bearer <JWT>`.

## Mock mode and production data

`USE_MOCK_DATA=true` is the default and supports six reliable demo states: calm, rise, fall, volume, news, and outage. To add a real provider, replace the mock calls behind the existing `marketDataService` and `newsService` interfaces, configure `MARKET_API_KEY`/`NEWS_API_KEY`, and migrate the file store to Prisma/PostgreSQL. This keeps external-provider failure handling localized and leaves the product flow unchanged.

## Why it is different

A normal watchlist presents raw quotes. MarketPulse saves a personal checkpoint, compares every watched stock against that moment, scores the importance of price, volume, and events, and explains the resulting signal in clear, non-advisory language.
