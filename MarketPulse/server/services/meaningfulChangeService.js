export const thresholds = { smallMove: 1, meaningfulMove: 3, highMove: 5, notableVolume: 1.5, meaningfulVolume: 2, worthChecking: 3, highAttention: 6 };
export function assessChange({ previous, current, news = [] }) {
  const priceChange = previous?.price ? ((current.price - previous.price) / previous.price) * 100 : current.dayChange;
  const volumeRatio = current.volume / current.averageVolume;
  let score = 0; const drivers = [];
  if (Math.abs(priceChange) >= thresholds.highMove) { score += 4; drivers.push('sharp price movement'); }
  else if (Math.abs(priceChange) >= thresholds.meaningfulMove) { score += 3; drivers.push('meaningful price movement'); }
  else if (Math.abs(priceChange) >= thresholds.smallMove) { score += 1; drivers.push('modest price movement'); }
  if (volumeRatio >= thresholds.meaningfulVolume) { score += 3; drivers.push('unusually high volume'); }
  else if (volumeRatio >= thresholds.notableVolume) { score += 1; drivers.push('notable volume'); }
  const newsScore = Math.max(0, ...news.map(n => n.impactScore)); score += newsScore;
  if (newsScore) drivers.push(`${news.length} important event${news.length > 1 ? 's' : ''}`);
  const status = score >= thresholds.highAttention ? 'HIGH ATTENTION' : score >= thresholds.worthChecking ? 'WORTH CHECKING' : 'STABLE';
  const movement = `${priceChange >= 0 ? 'rose' : 'fell'} ${Math.abs(priceChange).toFixed(1)}%`;
  const why = status === 'STABLE' ? `${current.companyName} has had no meaningful changes since your last check.` : `${current.companyName} ${movement} since your last check${volumeRatio >= 1.5 ? ` while volume reached ${volumeRatio.toFixed(1)}× normal` : ''}${newsScore ? ' following important news' : ''}. This is worth reviewing, not financial advice.`;
  return { score, status, priceChange: +priceChange.toFixed(2), volumeRatio: +volumeRatio.toFixed(1), previousPrice: previous?.price ?? +(current.price / (1 + current.dayChange / 100)).toFixed(2), previousVolume: previous?.volume ?? current.averageVolume, why, drivers };
}
