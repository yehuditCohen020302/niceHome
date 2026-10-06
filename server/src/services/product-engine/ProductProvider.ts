import type { Product, ProductCategory, Store, Style } from '@nice-home/shared';

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

/**
 * One source of products: a store API, an affiliate/merchant feed, a marketplace, or the mock.
 * Providers may return loosely filtered results; the engine applies the hard filters.
 */
export interface ProductProvider {
  readonly id: string;
  searchProducts(params: ProductSearchParams): Promise<ProviderProduct[]>;
  /** Fetches one product fresh from the source, for price/availability refresh. */
  getProduct(externalId: string): Promise<ProviderProduct | null>;
  getStores(): Promise<Store[]>;
}
