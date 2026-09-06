import { scenarioInfo } from './marketDataService.js';
const stories = {
  NVDA: { title: 'AI infrastructure demand accelerates', description: 'Enterprise AI spending commentary points to sustained demand.', source: 'MarketPulse Wire' },
  AAPL: { title: 'Analyst estimate updated', description: 'Revenue expectations were revised following channel checks.', source: 'MarketPulse Wire' },
  TSLA: { title: 'Delivery outlook draws attention', description: 'Investors are reviewing an updated delivery outlook.', source: 'MarketPulse Wire' }
};
export function getNews(symbol, scenario = 'calm') { const impact = scenarioInfo(scenario).news; const item = stories[symbol] || { title: 'No major company event detected', description: 'No significant news was found in the selected demo scenario.', source: 'MarketPulse Wire' }; return impact ? [{ ...item, impactScore: impact, timestamp: new Date(Date.now() - 1000 * 60 * 36).toISOString() }] : []; }
