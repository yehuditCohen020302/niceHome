import type { ProductSpec, Room, RoomAnalysis, Style } from '@nice-home/shared';

export interface DesignPlan {
  /** The style to design for; resolved when the user chose 'auto'. */
  style: Style;
  /** Ordered by priority: earlier specs get first claim on the budget. */
  specs: ProductSpec[];
}

/**
 * Decides what to add or replace. Produces specs only — never prices, stores or concrete products.
 * Price caps are assigned later by the budget allocator.
 */
export interface DesignPlanner {
  readonly id: string;
  plan(room: Room, analysis: RoomAnalysis): Promise<DesignPlan>;
}
