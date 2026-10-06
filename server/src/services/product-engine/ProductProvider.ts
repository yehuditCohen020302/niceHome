import type { Product, ProductCategory, ProductSourceStatus, Store, Style } from '@nice-home/shared';

export interface ProductSearchParams {
  category: ProductCategory;
  maxPrice?: number;
  style?: Style;
  colors?: string[];
  country: string;
  city?: string;
  limit?: number;
}

/** A product as a source returns it, before the engine assigns the internal id. */
export type ProviderProduct = Omit<Product, 'id' | 'providerId'>;

/** Thrown when a provider has no data yet (e.g. its first catalog download is still running). */
export class ProviderNotReadyError extends Error {
  constructor(providerId: string) {
    super(`Product provider "${providerId}" is not ready yet`);
  }
}

/**
 * One source of products: a store catalog, an affiliate/merchant feed, a marketplace, or the mock.
 * Providers may return loosely filtered results; the engine applies the hard filters.
 */
export interface ProductProvider {
  readonly id: string;
  searchProducts(params: ProductSearchParams): Promise<ProviderProduct[]>;
  /** Fetches one product from the source (or its latest synced copy), for price/availability. */
  getProduct(externalId: string): Promise<ProviderProduct | null>;
  getStores(): Promise<Store[]>;
  /** Freshness of each source this provider covers. */
  status(): ProductSourceStatus[];
}
