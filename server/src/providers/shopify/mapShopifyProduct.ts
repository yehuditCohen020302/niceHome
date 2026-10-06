import type { ProviderProduct } from '../../services/product-engine/ProductProvider';
import { classifyCategory, extractColors, extractStyles } from '../classify';
import type { ShopifyStoreConfig } from './stores';

/** The fields we use from Shopify's public `products.json` (also the shape we keep on disk). */
export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type?: string;
  tags?: string[] | string;
  variants?: { price: string; available?: boolean }[];
  images?: { src: string }[];
}

/**
 * Maps one Shopify product to our model. Returns null when it is not a living-room item we
 * recognise, or when data we must not invent (price, image) is missing.
 */
export function mapShopifyProduct(
  store: ShopifyStoreConfig,
  product: ShopifyProduct,
  syncedAt: string,
): ProviderProduct | null {
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : (product.tags ?? '');
  // Only the product's own title decides its category (see classifyCategory).
  const category = classifyCategory(product.title);
  if (!category) return null;

  const image = product.images?.[0]?.src;
  const variants = (product.variants ?? [])
    .map((variant) => ({ price: Number(variant.price), available: variant.available === true }))
    .filter((variant) => Number.isFinite(variant.price) && variant.price > 0);
  if (!image || variants.length === 0) return null;

  const available = variants.filter((variant) => variant.available);
  const offered = available.length > 0 ? available : variants;
  const prices = new Set(offered.map((variant) => variant.price));
  const text = `${product.title} ${tags}`;
  const colors = extractColors(text);
  const styles = extractStyles(text);

  return {
    externalId: `${store.id}:${product.handle}`,
    name: product.title.trim(),
    price: Math.min(...prices),
    ...(prices.size > 1 ? { priceIsFrom: true } : {}),
    currency: store.currency,
    imageUrl: image,
    productUrl: `${store.origin}/products/${encodeURIComponent(product.handle)}`,
    storeId: store.id,
    category,
    ...(colors.length ? { colors } : {}),
    ...(styles.length ? { styles } : {}),
    availability: available.length > 0 ? 'in_stock' : 'out_of_stock',
    lastUpdated: syncedAt,
    mock: false,
  };
}

/** Keeps only the fields we use, so the on-disk catalog stays small but can be re-classified later. */
export function trimShopifyProduct(product: ShopifyProduct): ShopifyProduct {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    ...(product.product_type ? { product_type: product.product_type } : {}),
    ...(product.tags ? { tags: product.tags } : {}),
    variants: (product.variants ?? []).map((variant) => ({ price: variant.price, available: variant.available === true })),
    images: product.images?.[0] ? [{ src: product.images[0].src }] : [],
  };
}
