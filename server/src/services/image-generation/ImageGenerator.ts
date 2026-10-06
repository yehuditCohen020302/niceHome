import type { Product, ProductSpec, Room } from '@nice-home/shared';

export interface GenerationItem {
  product: Product;
  spec: ProductSpec;
}

export interface GenerationRequest {
  room: Room;
  /** The chosen real products, each with the spec that says where it goes. */
  items: GenerationItem[];
}

export interface GenerationResult {
  /** `null` when no image was generated. */
  imageUrl: string | null;
}

/** Raised for a generation failure that should be shown to the user, not crash the design. */
export class GenerationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Renders the upgraded room using the selected real products as references,
 * keeping the room structure and every protected item unchanged.
 */
export interface ImageGenerator {
  readonly id: string;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}
