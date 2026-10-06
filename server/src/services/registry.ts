import { config } from '../config';
import type { PipelineServices } from '../pipeline/generateDesign';
import path from 'node:path';
import { MockProductProvider } from '../providers/mock/MockProductProvider';
import { SerpApiProvider } from '../providers/serpapi/SerpApiProvider';
import { ShopifyCatalogProvider } from '../providers/shopify/ShopifyCatalogProvider';
import { SHOPIFY_STORES } from '../providers/shopify/stores';
import { RuleBasedPlanner } from './design-planner/RuleBasedPlanner';
import type { ImageAnalyzer } from './image-analysis/ImageAnalyzer';
import { MockImageAnalyzer } from './image-analysis/MockImageAnalyzer';
import type { ImageGenerator } from './image-generation/ImageGenerator';
import { MockImageGenerator } from './image-generation/MockImageGenerator';
import { ProductEngine } from './product-engine/ProductEngine';
import type { ProductProvider } from './product-engine/ProductProvider';
import { RuleBasedRanker } from './product-ranker/RuleBasedRanker';

/**
 * Available implementations, selected by id from .env.
 * Connecting a real service = adding an entry here; nothing else in the app changes.
 */
const ANALYZERS: Record<string, () => ImageAnalyzer> = {
  mock: () => new MockImageAnalyzer(),
};
const GENERATORS: Record<string, () => ImageGenerator> = {
  mock: () => new MockImageGenerator(),
};
const maxAgeMs = config.priceTtlMinutes * 60 * 1000;
const PRODUCT_PROVIDERS: Record<string, () => ProductProvider & { start?: () => Promise<void> }> = {
  mock: () => new MockProductProvider(),
  shopify: () => new ShopifyCatalogProvider(SHOPIFY_STORES, path.join(config.cacheDir, 'catalogs'), maxAgeMs),
  serpapi: () => new SerpApiProvider(config.serpApiKey, path.join(config.cacheDir, 'serpapi'), maxAgeMs),
};

function pick<T>(kind: string, registry: Record<string, () => T>, id: string): T {
  const factory = registry[id];
  if (!factory) {
    throw new Error(`Unknown ${kind} "${id}". Available: ${Object.keys(registry).join(', ')}`);
  }
  return factory();
}

const providers = config.productProviders.map((id) => pick('PRODUCT_PROVIDERS entry', PRODUCT_PROVIDERS, id));

/** Built once at startup, so a misconfigured .env fails immediately with a clear message. */
export const services: PipelineServices = {
  analyzer: pick('ANALYSIS_ENGINE', ANALYZERS, config.analysisEngine),
  planner: new RuleBasedPlanner(),
  engine: new ProductEngine(providers),
  ranker: new RuleBasedRanker(),
  generator: pick('GENERATION_ENGINE', GENERATORS, config.generationEngine),
};

/** Loads cached catalogs and starts background downloads. Searches work as soon as any source is ready. */
export async function startProductSources(): Promise<void> {
  await Promise.all(providers.map((provider) => provider.start?.()));
}

/** Which parts of the app are mocks right now, so the UI can say exactly what is real. */
export function mockParts() {
  return {
    products: config.productProviders.includes('mock'),
    analysis: services.analyzer.id === 'mock',
    generation: services.generator.id === 'mock',
  };
}
