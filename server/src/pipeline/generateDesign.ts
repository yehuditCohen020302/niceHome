import {
  DEFAULT_COUNTRY,
  type Design,
  type Product,
  type ProductSpec,
  type Room,
  type Store,
} from '@nice-home/shared';
import { newId } from '../storage/ids';
import { CATEGORY_BUDGET_WEIGHT } from './budgetWeights';
import type { DesignPlanner } from '../services/design-planner/DesignPlanner';
import type { ImageAnalyzer } from '../services/image-analysis/ImageAnalyzer';
import type { ImageGenerator } from '../services/image-generation/ImageGenerator';
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

/** Selected product plus this many alternatives are kept per item for quick replacement. */
const CANDIDATES_PER_ITEM = 4;

/**
 * Product-first pipeline:
 *   analyze room → plan specs → find real products within budget → rank → generate image → map hotspots.
 * The image is generated only after real products are chosen, using them as the reference.
 */
export async function generateDesign(room: Room, services: PipelineServices): Promise<DesignRecord> {
  const { analyzer, planner, engine, ranker, generator } = services;

  const analysis = await analyzer.analyze(room);
  const plan = await planner.plan(room, analysis);

  const specs: ProductSpec[] = [];
  const selected: SelectedProduct[] = [];
  const unmatchedSpecs: ProductSpec[] = [];
  const productsById = new Map<string, Product>();

  // Budget is allocated item by item: each spec's cap is its weighted share of what is
  // still left. Money an earlier item did not use, or an unmatched item's share, flows
  // to later items — and the total can never exceed the budget.
  let remainingBudget = room.budget;
  let remainingWeight = plan.specs.reduce((sum, spec) => sum + CATEGORY_BUDGET_WEIGHT[spec.category], 0);

  for (const planned of plan.specs) {
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
      continue;
    }

    const ranked = (await ranker.rank(spec, candidates)).slice(0, CANDIDATES_PER_ITEM);
    const byId = new Map(candidates.map((product) => [product.id, product]));
    // The ranker may only reorder what the engine returned.
    const known = ranked.filter((candidate) => byId.has(candidate.productId));
    if (known.length === 0) {
      unmatchedSpecs.push(spec);
      continue;
    }
    for (const candidate of known) productsById.set(candidate.productId, byId.get(candidate.productId)!);

    const best = byId.get(known[0]!.productId)!;
    if (remainingBudget !== null) remainingBudget -= best.price;
    selected.push({ spec, ranked: known });
  }

  const chosenProducts = selected.map(({ ranked }) => productsById.get(ranked[0]!.productId)!);
  const generation = await generator.generate(room, chosenProducts);
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
    generatedImageUrl: generation.imageUrl,
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

  return { design, products, stores };
}
