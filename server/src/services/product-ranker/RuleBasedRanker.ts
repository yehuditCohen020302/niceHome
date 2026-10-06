import type { Product, ProductSpec, RankedCandidate } from '@nice-home/shared';
import type { ProductRanker } from './ProductRanker';

const WEIGHTS = { style: 0.45, color: 0.25, rating: 0.1, price: 0.1, stock: 0.1 } as const;

/** Spending about this share of the item's cap reads as "good value" rather than "cheapest" or "maxed out". */
const TARGET_PRICE_SHARE = 0.7;

/**
 * Deterministic scoring, not AI: style tag match, color overlap, rating, price fit, and confirmed stock.
 * Replaced by an AI ranker that looks at product images in Phase 2.
 */
export class RuleBasedRanker implements ProductRanker {
  readonly id = 'rules';

  async rank(spec: ProductSpec, candidates: Product[]): Promise<RankedCandidate[]> {
    return candidates
      .map((product) => score(spec, product))
      .sort((a, b) => b.matchScore - a.matchScore || a.productId.localeCompare(b.productId));
  }
}

function score(spec: ProductSpec, product: Product): RankedCandidate {
  const reasons: string[] = [];
  let total = 0;

  if (spec.style && product.styles?.includes(spec.style)) {
    total += WEIGHTS.style;
    reasons.push('style');
  }
  if (spec.colors?.some((color) => product.colors?.includes(color))) {
    total += WEIGHTS.color;
    reasons.push('color');
  }
  if (product.rating !== undefined) {
    total += WEIGHTS.rating * clamp((product.rating - 3) / 2);
  }
  if (product.availability === 'in_stock') {
    total += WEIGHTS.stock;
  }
  if (spec.maxPrice) {
    total += WEIGHTS.price * clamp(1 - Math.abs(product.price / spec.maxPrice - TARGET_PRICE_SHARE));
  } else {
    total += WEIGHTS.price / 2;
  }

  return {
    productId: product.id,
    matchScore: Math.round(total * 100) / 100,
    ...(reasons.length ? { reason: reasons.join(',') } : {}),
  };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
