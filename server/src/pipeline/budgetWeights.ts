import type { ProductCategory } from '@nice-home/shared';

/**
 * How strongly each category claims the budget, relative to the others.
 * A rug or a table naturally costs more than a cushion, so it gets a larger share.
 */
export const CATEGORY_BUDGET_WEIGHT: Record<ProductCategory, number> = {
  rug: 30,
  'coffee-table': 25,
  curtain: 22,
  lamp: 18,
  'side-table': 15,
  'wall-art': 14,
  mirror: 14,
  shelf: 12,
  plant: 8,
  cushion: 6,
  throw: 6,
  vase: 5,
};
