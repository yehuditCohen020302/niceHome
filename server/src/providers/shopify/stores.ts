/**
 * Israeli stores whose public product catalog we read (Shopify's storefront `products.json`,
 * which their robots.txt does not disallow). Each was checked by hand: prices are in ILS,
 * and the catalog includes living-room items.
 *
 * There is no partnership with these stores. We read only what any visitor's browser can
 * read, slowly and rarely (see PoliteClient), and every product links back to its store page.
 */
export interface ShopifyStoreConfig {
  id: string;
  name: string;
  /** Site origin, e.g. https://www.example.co.il */
  origin: string;
  currency: 'ILS';
  /**
   * `catalog`: read the whole catalog (small and mid-size stores).
   * `collections`: read only collections whose title matches living-room keywords (large stores).
   */
  mode: 'catalog' | 'collections';
  /** Minimum pause between our requests to this site; robots.txt Crawl-delay raises it further. */
  minIntervalMs: number;
  /** Safety cap on catalog pages (250 products each). */
  maxPages: number;
}

export const SHOPIFY_STORES: ShopifyStoreConfig[] = [
  { id: '1item', name: '1item', origin: 'https://www.1item.co.il', currency: 'ILS', mode: 'catalog', minIntervalMs: 3000, maxPages: 20 },
  { id: 'homestyle', name: 'Homestyle', origin: 'https://www.homestyle.co.il', currency: 'ILS', mode: 'catalog', minIntervalMs: 3000, maxPages: 20 },
  { id: 'foxhome', name: 'Fox Home', origin: 'https://www.foxhome.co.il', currency: 'ILS', mode: 'catalog', minIntervalMs: 3000, maxPages: 30 },
  { id: 'rico', name: 'Rico', origin: 'https://rico-brand.com', currency: 'ILS', mode: 'catalog', minIntervalMs: 3000, maxPages: 10 },
  { id: 'homecenter', name: 'הום סנטר', origin: 'https://www.homecenter.co.il', currency: 'ILS', mode: 'collections', minIntervalMs: 6000, maxPages: 40 },
];

/** Collection titles worth reading in `collections` mode. Products are still classified one by one. */
export const LIVING_ROOM_COLLECTION =
  /שטיח|תאורה|מנור|וילון|כרית|כריות|טקסטיל|עציץ|צמח|אגרטל|מראה|מראות|תמונ|נוי|דקור|שולחן סלון|שולחנות סלון|שולחן צד|מדף|מדפים|פלד|שמיכ/;
