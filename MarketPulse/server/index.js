import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; import express from 'express'; import cors from 'cors';
import { requireAuth } from './middleware/auth.js'; import * as auth from './controllers/authController.js'; import * as watchlist from './controllers/watchlistController.js'; import * as changes from './controllers/changesController.js';
import * as account from './controllers/accountController.js';
const app = express(); app.use(cors()); app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, '..', 'dist');

app.use(express.static(frontendPath));
app.get('/api/health', (_, res) => res.json({ status: 'ok', mockData: process.env.USE_MOCK_DATA !== 'false' }));
app.post('/api/auth/register', auth.register); app.post('/api/auth/login', auth.login); app.get('/api/auth/profile', requireAuth, auth.profile);
app.get('/api/watchlist', requireAuth, watchlist.list); app.get('/api/watchlist/search', requireAuth, watchlist.search); app.post('/api/watchlist', requireAuth, watchlist.add); app.patch('/api/watchlist/:symbol', requireAuth, watchlist.priority); app.delete('/api/watchlist/:symbol', requireAuth, watchlist.remove);
app.get('/api/changes', requireAuth, changes.dashboard); app.get('/api/changes/:symbol', requireAuth, changes.detail); app.post('/api/checkpoint', requireAuth, changes.checkpoint); app.get('/api/news/:symbol', requireAuth, changes.news); app.post('/api/demo/scenario', requireAuth, changes.setScenario);
app.get('/api/alerts', requireAuth, account.getAlerts); app.post('/api/alerts', requireAuth, account.addAlert); app.patch('/api/alerts/:id', requireAuth, account.toggleAlert); app.delete('/api/alerts/:id', requireAuth, account.deleteAlert);
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(frontendPath, 'index.html'));
    }
    next();
});
app.get('/api/portfolio', requireAuth, account.getPortfolio); app.post('/api/portfolio', requireAuth, account.addHolding); app.route('/api/preferences').get(requireAuth, account.preferences).patch(requireAuth, account.preferences);
app.use((err, _, res, __) => { console.error(err); res.status(500).json({ error: 'Something went wrong. Please try again.' }); });

app.listen(process.env.PORT || 3001, () => {
    console.log(`MarketPulse API running on port ${process.env.PORT || 3001}`);
});