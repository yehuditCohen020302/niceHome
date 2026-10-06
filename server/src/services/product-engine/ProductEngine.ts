import { DEFAULT_CURRENCY, type Product, type ProductSourceStatus, type Store } from '@nice-home/shared';
import {
  ProviderNotReadyError,
  type ProductProvider,
  type ProductSearchParams,
  type ProviderProduct,
} from './ProductProvider';

const ID_SEPARATOR = ':';

export class NoProvidersAvailableError extends Error {
  constructor(readonly causes: unknown[]) {
    super('All product providers failed');
  }

  /** Every provider is still downloading its first catalog — a wait, not a failure. */
  get stillSyncing(): boolean {
    return this.causes.length > 0 && this.causes.every((cause) => cause instanceof ProviderNotReadyError);
  }
}

/**
 * The single source of truth for commercial data. Queries every provider, normalizes
 * results to `Product`, applies hard filters and removes duplicates.
 * Nothing here is invented: a product either comes from a provider or does not exist.
 */
export class ProductEngine {
  private readonly providers: Map<string, ProductProvider>;

  constructor(providers: ProductProvider[]) {
    this.providers = new Map(providers.map((provider) => [provider.id, provider]));
  }

  get providerIds(): string[] {
    return [...this.providers.keys()];
  }

  async search(params: ProductSearchParams): Promise<Product[]> {
    const providers = [...this.providers.values()];
    const results = await Promise.allSettled(providers.map((provider) => provider.searchProducts(params)));

    // One failing source must not hide the others; only fail when every source failed.
    const failures = results.filter((result) => result.status === 'rejected');
    if (providers.length > 0 && failures.length === providers.length) {
      throw new NoProvidersAvailableError(failures.map((failure) => failure.reason));
    }

    const products = results.flatMap((result, index) =>
      result.status === 'fulfilled'
        ? result.value.flatMap((raw) => normalize(providers[index]!.id, raw) ?? [])
        : [],
    );

    return dedupe(products.filter((product) => passesHardFilters(product, params)));
  }

  async getProduct(id: string): Promise<Product | null> {
    const separator = id.indexOf(ID_SEPARATOR);
    if (separator <= 0) return null;
    const provider = this.providers.get(id.slice(0, separator));
    if (!provider) return null;
    const raw = await provider.getProduct(id.slice(separator + 1));
    return raw ? normalize(provider.id, raw) : null;
  }

  status(): ProductSourceStatus[] {
    return [...this.providers.values()].flatMap((provider) => provider.status());
  }

  async getStores(): Promise<Store[]> {
    const results = await Promise.allSettled([...this.providers.values()].map((provider) => provider.getStores()));
    return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  }
}

/**
 * Maps a provider record to the internal model and rejects records that lack the data
 * we are not allowed to make up (price, currency, product URL, image).
 */
function normalize(providerId: string, raw: ProviderProduct): Product | null {
  const valid =
    raw.externalId &&
    raw.name?.trim() &&
    Number.isFinite(raw.price) &&
    raw.price > 0 &&
    raw.currency &&
    raw.productUrl &&
    raw.imageUrl &&
    raw.storeId &&
    raw.lastUpdated;
  if (!valid) return null;

  return {
    ...raw,
    id: `${providerId}${ID_SEPARATOR}${raw.externalId}`,
    providerId,
    name: raw.name.trim(),
    price: Math.round(raw.price * 100) / 100,
  };
}

function passesHardFilters(product: Product, params: ProductSearchParams): boolean {
  return (
    product.category === params.category &&
    // Unknown availability is allowed (shown as "לא ידוע"); known-unavailable items are not offered.
    product.availability !== 'out_of_stock' &&
    product.availability !== 'preorder' &&
    // Comparing prices across currencies would need live exchange rates; only ILS for now.
    product.currency === DEFAULT_CURRENCY &&
    (params.maxPrice === undefined || product.price <= params.maxPrice)
  );
}

/** The same item sold by several sources: keep the cheapest offer per GTIN. */
function dedupe(products: Product[]): Product[] {
  const byKey = new Map<string, Product>();
  for (const product of products) {
    const key = product.gtin ? `gtin:${product.gtin}` : product.id;
    const existing = byKey.get(key);
    if (!existing || product.price < existing.price) byKey.set(key, product);
  }
  return [...byKey.values()];
}
