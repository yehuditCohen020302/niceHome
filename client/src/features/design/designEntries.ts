import type { DesignItem, Product, Store } from '@nice-home/shared';
import type { LoadedDesign } from './useDesign';

/** One purchasable item in a design, with everything the UI needs to show it. */
export interface DesignEntry {
  /** 1-based number shown on the hotspot and in the list. */
  number: number;
  item: DesignItem;
  product: Product;
  store: Store | undefined;
}

export function buildEntries({ design, products, stores }: LoadedDesign): DesignEntry[] {
  return design.items.flatMap((item, index) => {
    const product = products.get(item.productId);
    // A design always snapshots its products; a missing one means a corrupted file — skip, don't invent.
    if (!product) return [];
    return [{ number: index + 1, item, product, store: stores.get(product.storeId) }];
  });
}

export interface StoreGroup {
  storeId: string;
  store: Store | undefined;
  entries: DesignEntry[];
  subtotal: number;
}

/** Items grouped by store, so it is clear how many shops the list involves. */
export function groupByStore(entries: DesignEntry[]): StoreGroup[] {
  const groups = new Map<string, StoreGroup>();
  for (const entry of entries) {
    const id = entry.product.storeId;
    const group = groups.get(id) ?? { storeId: id, store: entry.store, entries: [], subtotal: 0 };
    group.entries.push(entry);
    group.subtotal = Math.round((group.subtotal + entry.product.price) * 100) / 100;
    groups.set(id, group);
  }
  return [...groups.values()];
}
