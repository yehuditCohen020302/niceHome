import type { Product, ProductSpec, RankedCandidate } from '@nice-home/shared';

/**
 * Orders candidate products for a spec, best match first.
 * May only rank the products it is given — it never adds products or changes their data.
 */
export interface ProductRanker {
  readonly id: string;
  rank(spec: ProductSpec, candidates: Product[]): Promise<RankedCandidate[]>;
}
