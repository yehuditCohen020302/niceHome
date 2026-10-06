import type { Product, Room } from '@nice-home/shared';

export interface GenerationResult {
  /** `null` when no image was generated. */
  imageUrl: string | null;
}

/**
 * Renders the upgraded room using the selected real products as references,
 * keeping the room structure and every protected item unchanged.
 */
export interface ImageGenerator {
  readonly id: string;
  generate(room: Room, products: Product[]): Promise<GenerationResult>;
}
