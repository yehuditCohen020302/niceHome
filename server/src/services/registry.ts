import { config } from '../config';
import type { PipelineServices } from '../pipeline/generateDesign';
import { MockProductProvider } from '../providers/mock/MockProductProvider';
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
const PRODUCT_PROVIDERS: Record<string, () => ProductProvider> = {
  mock: () => new MockProductProvider(),
};

function pick<T>(kind: string, registry: Record<string, () => T>, id: string): T {
  const factory = registry[id];
  if (!factory) {
    throw new Error(`Unknown ${kind} "${id}". Available: ${Object.keys(registry).join(', ')}`);
  }
  return factory();
}

/** Built once at startup, so a misconfigured .env fails immediately with a clear message. */
export const services: PipelineServices = {
  analyzer: pick('ANALYSIS_ENGINE', ANALYZERS, config.analysisEngine),
  planner: new RuleBasedPlanner(),
  engine: new ProductEngine(config.productProviders.map((id) => pick('PRODUCT_PROVIDERS entry', PRODUCT_PROVIDERS, id))),
  ranker: new RuleBasedRanker(),
  generator: pick('GENERATION_ENGINE', GENERATORS, config.generationEngine),
};
