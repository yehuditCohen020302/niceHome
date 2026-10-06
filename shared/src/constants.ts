/**
 * Closed value lists shared by client and server.
 * Display labels live in the client's i18n files, keyed by these ids.
 */

export const ROOM_TYPES = [
  'living-room',
  'bedroom',
  'kids-room',
  'kitchen',
  'balcony',
  'other',
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

/** Only the living room is supported in the MVP. */
export const SUPPORTED_ROOM_TYPES: readonly RoomType[] = ['living-room'];
export const DEFAULT_ROOM_TYPE: RoomType = 'living-room';

export const UPGRADE_GOALS = [
  'small-upgrade',
  'style-change',
  'accessories',
  'lighting',
  'curtains',
  'rug',
  'wall-art',
  'plants',
  'cushions',
  'tables',
  'other',
] as const;
export type UpgradeGoal = (typeof UPGRADE_GOALS)[number];

export const ROOM_CONSTRAINTS = [
  'sofa',
  'table',
  'tv',
  'cabinets',
  'walls',
  'floor',
  'windows',
  'doors',
] as const;
export type RoomConstraint = (typeof ROOM_CONSTRAINTS)[number];

export const STYLES = [
  'modern',
  'warm-modern',
  'minimalist',
  'scandinavian',
  'classic',
  'rustic',
  'luxury',
  'boho',
  'japandi',
] as const;
export type Style = (typeof STYLES)[number];
export type StyleChoice = Style | 'auto';

export const PRODUCT_CATEGORIES = [
  'rug',
  'plant',
  'wall-art',
  'curtain',
  'lamp',
  'cushion',
  'throw',
  'side-table',
  'coffee-table',
  'shelf',
  'vase',
  'mirror',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Budget presets in ILS. `null` means no limit. */
export const BUDGET_PRESETS: readonly (number | null)[] = [500, 1000, 2000, 5000, null];

export const DEFAULT_COUNTRY = 'IL';
export const DEFAULT_CURRENCY = 'ILS';
