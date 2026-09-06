import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'marketpulse.json');
const blank = { users: [], watchlistStocks: [], checkpoints: [], scenarios: {}, alerts: [], holdings: [], preferences: {} };
export async function readStore() {
  try { return { ...blank, ...JSON.parse(await fs.readFile(file, 'utf8')) }; }
  catch { await writeStore(blank); return structuredClone(blank); }
}
export async function writeStore(data) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(data, null, 2)); }
