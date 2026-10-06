import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProductCategory, ProductSourceStatus, Store } from '@nice-home/shared';
import type {
  ProductProvider,
  ProductSearchParams,
  ProviderProduct,
} from '../../services/product-engine/ProductProvider';
import { classifyCategory, extractColors, extractStyles } from '../classify';

/** Hebrew queries sent to Google Shopping per category. */
const CATEGORY_QUERIES: Record<ProductCategory, string> = {
  rug: 'שטיח לסלון',
  plant: 'עציץ דקורטיבי לסלון',
  'wall-art': 'תמונה לסלון',
  curtain: 'וילון לסלון',
  lamp: 'מנורה לסלון',
  cushion: 'כרית נוי לספה',
  throw: 'שמיכה לספה',
  'side-table': 'שולחן צד לסלון',
  'coffee-table': 'שולחן סלון',
  vase: 'אגרטל דקורטיבי',
  mirror: 'מראה לסלון',
  shelf: 'מדף קיר לסלון',
};

const API_URL = 'https://serpapi.com/search.json';
const REQUEST_TIMEOUT_MS = 30_000;

/** The fields we use from a SerpApi `google_shopping` result. */
export interface SerpShoppingResult {
  title?: string;
  price?: string;
  extracted_price?: number;
  source?: string;
  link?: string;
  product_link?: string;
  product_id?: string;
  thumbnail?: string;
  rating?: number;
  delivery?: string;
}

interface QueryCache {
  fetchedAt: string;
  products: ProviderProduct[];
  stores: Store[];
}

/**
 * Real offers from many Israeli stores via Google Shopping (SerpApi, paid API with a free tier).
 * Each category is queried at most once per cache period, to save searches.
 * Disabled — returns nothing, does not fail — when no SERPAPI_KEY is configured.
 */
export class SerpApiProvider implements ProductProvider {
  readonly id = 'serpapi';
  private readonly cache = new Map<ProductCategory, QueryCache>();
  private readonly inFlight = new Map<ProductCategory, Promise<QueryCache>>();
  private lastError?: string;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly cacheDir: string,
    private readonly maxAgeMs: number,
  ) {}

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  async start(): Promise<void> {
    if (!this.enabled) return;
    await fs.mkdir(this.cacheDir, { recursive: true });
    for (const file of await fs.readdir(this.cacheDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const cached = JSON.parse(await fs.readFile(path.join(this.cacheDir, file), 'utf8')) as QueryCache;
        this.cache.set(file.replace(/\.json$/, '') as ProductCategory, cached);
      } catch {
        // A corrupt cache file is simply refetched.
      }
    }
  }

  async searchProducts(params: ProductSearchParams): Promise<ProviderProduct[]> {
    if (!this.enabled) return [];
    return (await this.query(params.category)).products;
  }

  async getProduct(externalId: string): Promise<ProviderProduct | null> {
    for (const entry of this.cache.values()) {
      const found = entry.products.find((product) => product.externalId === externalId);
      if (found) return found;
    }
    return null;
  }

  async getStores(): Promise<Store[]> {
    const byId = new Map<string, Store>();
    for (const entry of this.cache.values()) for (const store of entry.stores) byId.set(store.id, store);
    return [...byId.values()];
  }

  status(): ProductSourceStatus[] {
    const entries = [...this.cache.values()];
    const latest = entries.map((entry) => entry.fetchedAt).sort().at(-1);
    return [
      {
        id: 'google-shopping',
        name: 'Google Shopping',
        providerId: this.id,
        status: !this.enabled ? 'disabled' : this.lastError && entries.length === 0 ? 'error' : 'ready',
        products: entries.reduce((sum, entry) => sum + entry.products.length, 0),
        ...(latest ? { syncedAt: latest } : {}),
      },
    ];
  }

  private async query(category: ProductCategory): Promise<QueryCache> {
    const cached = this.cache.get(category);
    if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < this.maxAgeMs) return cached;

    let pending = this.inFlight.get(category);
    if (!pending) {
      pending = this.fetchCategory(category).finally(() => this.inFlight.delete(category));
      this.inFlight.set(category, pending);
    }
    try {
      return await pending;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      // Better an older real result (with its true timestamp) than nothing.
      if (cached) return cached;
      throw error;
    }
  }

  private async fetchCategory(category: ProductCategory): Promise<QueryCache> {
    const url = new URL(API_URL);
    url.search = new URLSearchParams({
      engine: 'google_shopping',
      q: CATEGORY_QUERIES[category],
      gl: 'il',
      hl: 'iw',
      google_domain: 'google.co.il',
      api_key: this.apiKey!,
    }).toString();

    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const body = (await response.json()) as { shopping_results?: SerpShoppingResult[]; error?: string };
    if (!response.ok || body.error) {
      throw new Error(`SerpApi: ${body.error ?? `HTTP ${response.status}`}`);
    }

    const fetchedAt = new Date().toISOString();
    const entry = parseShoppingResults(category, body.shopping_results ?? [], fetchedAt);
    this.cache.set(category, entry);
    await fs.writeFile(path.join(this.cacheDir, `${category}.json`), JSON.stringify(entry), 'utf8');
    return entry;
  }
}

/** Exported for testing with recorded responses. */
export function parseShoppingResults(
  category: ProductCategory,
  results: SerpShoppingResult[],
  fetchedAt: string,
): QueryCache {
  const products: ProviderProduct[] = [];
  const stores = new Map<string, Store>();

  for (const result of results) {
    const title = result.title?.trim();
    const link = result.link ?? result.product_link;
    // Only shekel prices; a price in another currency is skipped, never converted by guesswork.
    const isShekel = /₪|ILS|ש"ח|ש״ח/.test(result.price ?? '');
    if (!title || !link || !result.thumbnail || !result.source || !isShekel || !(result.extracted_price! > 0)) continue;
    // The query is only a hint; the product's own title must confirm the category.
    if (classifyCategory(title) !== category) continue;

    const storeId = `gs-${slug(result.source)}`;
    if (!stores.has(storeId)) {
      const website = result.link ? new URL(result.link).origin : undefined;
      stores.set(storeId, { id: storeId, name: result.source, ...(website ? { website } : {}), mock: false });
    }
    const colors = extractColors(title);
    const styles = extractStyles(title);
    products.push({
      externalId: `${category}:${result.product_id ?? slug(link)}`,
      name: title,
      price: result.extracted_price!,
      currency: 'ILS',
      imageUrl: result.thumbnail,
      productUrl: link,
      storeId,
      category,
      ...(colors.length ? { colors } : {}),
      ...(styles.length ? { styles } : {}),
      // Google Shopping lists the offer but does not confirm stock.
      availability: 'unknown',
      ...(/משלוח חינם|free delivery/i.test(result.delivery ?? '') ? { shippingAvailable: true } : {}),
      ...(result.rating !== undefined ? { rating: result.rating } : {}),
      lastUpdated: fetchedAt,
      mock: false,
    });
  }
  return { fetchedAt, products, stores: [...stores.values()] };
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
