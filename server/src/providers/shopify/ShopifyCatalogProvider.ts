import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProductSourceStatus, Store } from '@nice-home/shared';
import {
  ProviderNotReadyError,
  type ProductProvider,
  type ProductSearchParams,
  type ProviderProduct,
} from '../../services/product-engine/ProductProvider';
import { PoliteClient } from '../politeClient';
import { mapShopifyProduct, trimShopifyProduct, type ShopifyProduct } from './mapShopifyProduct';
import { LIVING_ROOM_COLLECTION, type ShopifyStoreConfig } from './stores';

const PAGE_SIZE = 250;
const MAX_COLLECTION_PAGES = 20;
/** How often to check whether a catalog has become stale. */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

const CACHE_VERSION = 2;

/**
 * On disk we keep the store's raw records (trimmed to the fields we use), not our mapped
 * products — so improving the classification rules takes effect on restart, with no re-download.
 */
interface CatalogCache {
  version: typeof CACHE_VERSION;
  storeId: string;
  syncedAt: string;
  raw: ShopifyProduct[];
}

interface StoreState {
  config: ShopifyStoreConfig;
  client: PoliteClient;
  cache: CatalogCache | null;
  /** Living-room products mapped from `cache.raw`. */
  products: ProviderProduct[];
  syncing: boolean;
  lastError?: string;
}

/**
 * Real products from Israeli stores' public Shopify catalogs.
 * Catalogs are downloaded in the background and kept on disk; searches never hit the stores.
 * A product's `lastUpdated` is when its catalog was last downloaded — the moment we last saw that price.
 */
export class ShopifyCatalogProvider implements ProductProvider {
  readonly id = 'shopify';
  private readonly stores: StoreState[];

  constructor(
    configs: ShopifyStoreConfig[],
    private readonly cacheDir: string,
    private readonly maxAgeMs: number,
  ) {
    this.stores = configs.map((config) => ({
      config,
      client: new PoliteClient(config.origin, config.minIntervalMs),
      cache: null,
      products: [],
      syncing: false,
    }));
  }

  /** Loads cached catalogs and starts background syncs for missing or stale ones. */
  async start(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
    await Promise.all(this.stores.map((store) => this.loadCache(store)));
    this.syncStale();
    setInterval(() => this.syncStale(), CHECK_INTERVAL_MS).unref();
  }

  async searchProducts(params: ProductSearchParams): Promise<ProviderProduct[]> {
    const ready = this.stores.filter((store) => store.cache);
    if (ready.length === 0) throw new ProviderNotReadyError(this.id);
    return ready.flatMap((store) => store.products.filter((product) => product.category === params.category));
  }

  async getProduct(externalId: string): Promise<ProviderProduct | null> {
    const storeId = externalId.slice(0, externalId.indexOf(':'));
    const store = this.stores.find((candidate) => candidate.config.id === storeId);
    return store?.products.find((product) => product.externalId === externalId) ?? null;
  }

  async getStores(): Promise<Store[]> {
    return this.stores.map(({ config }) => ({ id: config.id, name: config.name, website: config.origin, mock: false }));
  }

  status(): ProductSourceStatus[] {
    return this.stores.map((store) => ({
      id: store.config.id,
      name: store.config.name,
      providerId: this.id,
      status: store.cache ? 'ready' : store.syncing ? 'syncing' : store.lastError ? 'error' : 'syncing',
      products: store.products.length,
      ...(store.cache ? { syncedAt: store.cache.syncedAt } : {}),
    }));
  }

  private syncStale(): void {
    for (const store of this.stores) {
      const age = store.cache ? Date.now() - new Date(store.cache.syncedAt).getTime() : Infinity;
      if (!store.syncing && age >= this.maxAgeMs) void this.sync(store);
    }
  }

  private async sync(store: StoreState): Promise<void> {
    store.syncing = true;
    const started = Date.now();
    const syncedAt = new Date().toISOString();
    try {
      const raw = store.config.mode === 'catalog' ? await this.readCatalog(store) : await this.readCollections(store);
      const cache: CatalogCache = { version: CACHE_VERSION, storeId: store.config.id, syncedAt, raw };
      await this.saveCache(cache);
      this.applyCache(store, cache);
      delete store.lastError;
      console.log(
        `[sources] ${store.config.name}: ${store.products.length} living-room products of ${raw.length} read (${Math.round((Date.now() - started) / 1000)}s)`,
      );
    } catch (error) {
      store.lastError = error instanceof Error ? error.message : String(error);
      // Keep serving the previous catalog, if any; its timestamps stay honest.
      console.warn(`[sources] ${store.config.name}: sync failed — ${store.lastError}`);
    } finally {
      store.syncing = false;
    }
  }

  private applyCache(store: StoreState, cache: CatalogCache): void {
    store.cache = cache;
    store.products = cache.raw.flatMap((raw) => mapShopifyProduct(store.config, raw, cache.syncedAt) ?? []);
  }

  private async readCatalog(store: StoreState): Promise<ShopifyProduct[]> {
    const byId = new Map<number, ShopifyProduct>();
    for (let page = 1; page <= store.config.maxPages; page++) {
      const { products } = await store.client.getJson<{ products: ShopifyProduct[] }>(
        `/products.json?limit=${PAGE_SIZE}&page=${page}`,
      );
      for (const raw of products) byId.set(raw.id, trimShopifyProduct(raw));
      if (products.length < PAGE_SIZE) break;
    }
    return [...byId.values()];
  }

  private async readCollections(store: StoreState): Promise<ShopifyProduct[]> {
    const collections: { handle: string; title: string }[] = [];
    for (let page = 1; page <= MAX_COLLECTION_PAGES; page++) {
      const result = await store.client.getJson<{
        collections: { handle: string; title: string; products_count?: number }[];
      }>(`/collections.json?limit=${PAGE_SIZE}&page=${page}`);
      collections.push(
        ...result.collections.filter(
          (collection) => (collection.products_count ?? 1) > 0 && LIVING_ROOM_COLLECTION.test(collection.title),
        ),
      );
      if (result.collections.length < PAGE_SIZE) break;
    }

    const byId = new Map<number, ShopifyProduct>();
    let pagesRead = 0;
    for (const collection of collections) {
      for (let page = 1; pagesRead < store.config.maxPages; page++) {
        pagesRead++;
        const { products } = await store.client.getJson<{ products: ShopifyProduct[] }>(
          `/collections/${encodeURIComponent(collection.handle)}/products.json?limit=${PAGE_SIZE}&page=${page}`,
        );
        for (const raw of products) byId.set(raw.id, trimShopifyProduct(raw));
        if (products.length < PAGE_SIZE) break;
      }
    }
    return [...byId.values()];
  }

  private cachePath(storeId: string): string {
    return path.join(this.cacheDir, `${storeId}.json`);
  }

  private async loadCache(store: StoreState): Promise<void> {
    try {
      const cache = JSON.parse(await fs.readFile(this.cachePath(store.config.id), 'utf8')) as CatalogCache;
      // An older cache format is ignored and re-downloaded.
      if (cache.version === CACHE_VERSION) this.applyCache(store, cache);
    } catch {
      // No cache yet: the first sync will create it.
    }
  }

  private async saveCache(cache: CatalogCache): Promise<void> {
    // Write then rename, so a crash mid-write never leaves a half-written catalog.
    const target = this.cachePath(cache.storeId);
    await fs.writeFile(`${target}.tmp`, JSON.stringify(cache), 'utf8');
    await fs.rename(`${target}.tmp`, target);
  }
}
