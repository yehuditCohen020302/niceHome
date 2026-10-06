import {
  DEFAULT_COUNTRY,
  type Design,
  type DesignStageProgress,
  type Product,
  type ProductSpec,
  type Room,
  type Store,
} from '@nice-home/shared';
import { newId } from '../storage/ids';
import { CATEGORY_BUDGET_WEIGHT } from './budgetWeights';
import type { DesignPlanner } from '../services/design-planner/DesignPlanner';
import type { ImageAnalyzer } from '../services/image-analysis/ImageAnalyzer';
import {
  GenerationError,
  type GenerationRequest,
  type ImageGenerator,
} from '../services/image-generation/ImageGenerator';
import type { ProductEngine } from '../services/product-engine/ProductEngine';
import { mapProducts, type SelectedProduct } from '../services/product-mapping/mapProducts';
import type { ProductRanker } from '../services/product-ranker/ProductRanker';

export interface PipelineServices {
  analyzer: ImageAnalyzer;
  planner: DesignPlanner;
  engine: ProductEngine;
  ranker: ProductRanker;
  generator: ImageGenerator;
}

export interface DesignRecord {
  design: Design;
  /** Snapshot of every product the design references (selected + alternatives). */
  products: Product[];
  stores: Store[];
}

/** Called as each stage starts, advances and finishes, so the client can show real progress. */
export type ProgressListener = (progress: DesignStageProgress) => void;

/** Selected product plus this many alternatives are kept per item for quick replacement. */
const CANDIDATES_PER_ITEM = 4;

/**
 * Product-first pipeline:
 *   analyze room → plan specs → find real products within budget → rank → generate image → map hotspots.
 * The image is generated only after real products are chosen, using them as the reference.
 */
export async function generateDesign(
  room: Room,
  services: PipelineServices,
  onProgress: ProgressListener = () => {},
): Promise<DesignRecord> {
  const { analyzer, planner, engine, ranker, generator } = services;

  onProgress({ id: 'analyze', status: 'active' });
  const analysis = await analyzer.analyze(room);
  onProgress({ id: 'analyze', status: 'done' });

  onProgress({ id: 'plan', status: 'active' });
  const plan = await planner.plan(room, analysis);
  onProgress({ id: 'plan', status: 'done' });

  const specs: ProductSpec[] = [];
  const selected: SelectedProduct[] = [];
  const unmatchedSpecs: ProductSpec[] = [];
  const productsById = new Map<string, Product>();

  // Budget is allocated item by item: each spec's cap is its weighted share of what is
  // still left. Money an earlier item did not use, or an unmatched item's share, flows
  // to later items — and the total can never exceed the budget.
  let remainingBudget = room.budget;
  let remainingWeight = plan.specs.reduce((sum, spec) => sum + CATEGORY_BUDGET_WEIGHT[spec.category], 0);

  const total = plan.specs.length;
  onProgress({ id: 'search', status: 'active', done: 0, total });
  for (const [index, planned] of plan.specs.entries()) {
    const report = () => onProgress({ id: 'search', status: 'active', done: index + 1, total });
    const weight = CATEGORY_BUDGET_WEIGHT[planned.category];
    const maxPrice =
      remainingBudget === null ? undefined : Math.floor((remainingBudget * weight) / remainingWeight);
    const spec: ProductSpec = { ...planned, ...(maxPrice !== undefined ? { maxPrice } : {}) };
    specs.push(spec);
    remainingWeight -= weight;

    const candidates = await engine.search({
      category: spec.category,
      ...(maxPrice !== undefined ? { maxPrice } : {}),
      ...(spec.style ? { style: spec.style } : {}),
      ...(spec.colors ? { colors: spec.colors } : {}),
      country: room.location?.country ?? DEFAULT_COUNTRY,
      ...(room.location?.city ? { city: room.location.city } : {}),
    });
    if (candidates.length === 0) {
      unmatchedSpecs.push(spec);
      report();
      continue;
    }

    const ranked = (await ranker.rank(spec, candidates)).slice(0, CANDIDATES_PER_ITEM);
    const byId = new Map(candidates.map((product) => [product.id, product]));
    // The ranker may only reorder what the engine returned.
    const known = ranked.filter((candidate) => byId.has(candidate.productId));
    if (known.length === 0) {
      unmatchedSpecs.push(spec);
      report();
      continue;
    }
    for (const candidate of known) productsById.set(candidate.productId, byId.get(candidate.productId)!);

    const best = byId.get(known[0]!.productId)!;
    if (remainingBudget !== null) remainingBudget -= best.price;
    selected.push({ spec, ranked: known });
    report();
  }
  onProgress({ id: 'search', status: 'done', done: total, total });

  const chosenProducts = selected.map(({ ranked }) => productsById.get(ranked[0]!.productId)!);
  const { generatedImageUrl, generationError } = await renderVisualization(
    generator,
    { room, items: selected.map(({ spec }, index) => ({ spec, product: chosenProducts[index]! })) },
    onProgress,
  );

  onProgress({ id: 'map', status: 'active' });
  const items = mapProducts(analysis, selected);
  const totalPrice = Math.round(chosenProducts.reduce((sum, product) => sum + product.price, 0) * 100) / 100;

  const products = [...productsById.values()];
  const storeIds = new Set(products.map((product) => product.storeId));
  const stores = (await engine.getStores()).filter((store) => storeIds.has(store.id));

  const pipeline = {
    analysis: analyzer.id,
    planner: planner.id,
    productProviders: engine.providerIds,
    ranker: ranker.id,
    generation: generator.id,
  };
  const mock =
    analysis.mock ||
    [pipeline.analysis, pipeline.generation, ...pipeline.productProviders].includes('mock') ||
    products.some((product) => product.mock);

  const design: Design = {
    id: newId(),
    roomId: room.id,
    generatedImageUrl,
    ...(generationError ? { generationError } : {}),
    style: plan.style,
    budget: room.budget,
    specs,
    items,
    totalPrice,
    unmatchedSpecs,
    pipeline,
    mock,
    createdAt: new Date().toISOString(),
  };

  onProgress({ id: 'map', status: 'done' });
  return { design, products, stores };
}

/**
 * Runs the image generator and reports the `generate` stage. Never throws: a failed
 * visualization must not throw away a valid design of real products — the design keeps
 * no image, and the reason is shown to the user.
 */
export async function renderVisualization(
  generator: ImageGenerator,
  request: GenerationRequest,
  onProgress: ProgressListener,
): Promise<{ generatedImageUrl: string | null; generationError?: Design['generationError'] }> {
  onProgress({ id: 'generate', status: 'active' });
  let generatedImageUrl: string | null = null;
  let generationError: Design['generationError'];
  try {
    generatedImageUrl = (await generator.generate(request)).imageUrl;
  } catch (error) {
    generationError =
      error instanceof GenerationError
        ? { code: error.code, message: error.message }
        : { code: 'failed', message: 'Image generation failed' };
    if (error instanceof GenerationError) console.warn(`[generation] ${error.code}: ${error.message}`);
    else console.error(error);
  }
  // No image and no error means no generator is connected yet: skipped, not done.
  onProgress({ id: 'generate', status: generatedImageUrl ? 'done' : generationError ? 'failed' : 'skipped' });
  return { generatedImageUrl, ...(generationError ? { generationError } : {}) };
}

/** Creates (or retries) the visualization for an existing design, keeping its products and hotspots. */
export async function visualizeDesign(
  record: DesignRecord,
  room: Room,
  generator: ImageGenerator,
  onProgress: ProgressListener = () => {},
): Promise<DesignRecord> {
  const { design } = record;
  const products = new Map(record.products.map((product) => [product.id, product]));
  const specs = new Map(design.specs.map((spec) => [spec.id, spec]));
  const items = design.items.flatMap((item) => {
    const product = products.get(item.productId);
    const spec = specs.get(item.specId);
    return product && spec ? [{ product, spec }] : [];
  });

  const { generatedImageUrl, generationError } = await renderVisualization(generator, { room, items }, onProgress);
  const { generationError: _previous, ...rest } = design;
  return {
    ...record,
    design: {
      ...rest,
      generatedImageUrl,
      ...(generationError ? { generationError } : {}),
      pipeline: { ...design.pipeline, generation: generator.id },
      mock:
        design.pipeline.analysis === 'mock' ||
        design.pipeline.productProviders.includes('mock') ||
        generator.id === 'mock' ||
        record.products.some((product) => product.mock),
    },
  };
}
