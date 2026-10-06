import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// API keys and engine selection live in the repo-root .env, read only by the server.
dotenv.config({ path: path.join(serverRoot, '..', '.env'), quiet: true });

function readList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}"`);
  }
  return value;
}

export const config = {
  port: readNumber('PORT', 3001),
  dataDir: path.join(serverRoot, 'data'),
  /** Downloaded store catalogs and API results; safe to delete (they are re-downloaded). */
  cacheDir: path.join(serverRoot, 'data', 'cache'),
  productProviders: readList('PRODUCT_PROVIDERS', ['shopify', 'serpapi']),
  /** Optional. Enables Google Shopping results via SerpApi. */
  serpApiKey: process.env.SERPAPI_KEY?.trim() || undefined,
  analysisEngine: process.env.ANALYSIS_ENGINE ?? 'mock',
  generationEngine: process.env.GENERATION_ENGINE ?? 'mock',
  priceTtlMinutes: readNumber('PRICE_TTL_MINUTES', 360),
} as const;
