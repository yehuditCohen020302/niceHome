import { DEFAULT_CURRENCY, PRODUCT_CATEGORIES, type ProductCategory, type Store } from '@nice-home/shared';
import type {
  ProductProvider,
  ProductSearchParams,
  ProviderProduct,
} from '../../services/product-engine/ProductProvider';
import { COLOR_HEX, MOCK_ITEMS, MOCK_STORES } from './catalog';

/**
 * MOCK provider: serves the clearly labeled sample catalog. Every product it returns
 * has `mock: true`. Lets the full UX be built before real sources are connected (Phase 4).
 */
export class MockProductProvider implements ProductProvider {
  readonly id = 'mock';
  private readonly products: ProviderProduct[];

  constructor() {
    // A fixed timestamp per server start; real providers report when the source last confirmed the price.
    const lastUpdated = new Date().toISOString();
    this.products = PRODUCT_CATEGORIES.flatMap((category) =>
      MOCK_ITEMS[category].map((item): ProviderProduct => {
        const store = MOCK_STORES.find((candidate) => candidate.id === item.store);
        return {
          externalId: item.sku,
          name: item.name,
          price: item.price,
          currency: DEFAULT_CURRENCY,
          imageUrl: mockImageUrl(category, item.colors[0]),
          productUrl: `https://example.com/mock-product/${item.sku}`,
          storeId: item.store,
          category,
          colors: item.colors,
          materials: item.materials,
          styles: item.styles,
          availability: item.availability ?? 'in_stock',
          shippingAvailable: true,
          ...(store?.city ? { city: store.city } : {}),
          ...(item.rating !== undefined ? { rating: item.rating } : {}),
          lastUpdated,
          mock: true,
        };
      }),
    );
  }

  async searchProducts(params: ProductSearchParams): Promise<ProviderProduct[]> {
    const matches = this.products.filter((product) => product.category === params.category);
    return params.limit ? matches.slice(0, params.limit) : matches;
  }

  async getProduct(externalId: string): Promise<ProviderProduct | null> {
    return this.products.find((product) => product.externalId === externalId) ?? null;
  }

  async getStores(): Promise<Store[]> {
    return MOCK_STORES;
  }
}

function mockImageUrl(category: ProductCategory, color: string | undefined): string {
  const hex = (color && COLOR_HEX[color]) ?? '#c9a77c';
  return `/api/mock-assets/products/${category}.svg?color=${encodeURIComponent(hex)}`;
}
