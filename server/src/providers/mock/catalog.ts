import type { Availability, ProductCategory, Store, Style } from '@nice-home/shared';

/**
 * MOCK DATA for UI development. These are NOT real products, stores, prices or links.
 * Every record is marked `mock: true`, store names say "לדוגמה", and links point to
 * example.com (a domain reserved for documentation) so nothing leads to a real shop.
 */

export const MOCK_STORES: Store[] = [
  { id: 'store-a', name: 'בית לדוגמה', website: 'https://example.com/store-a', city: 'ירושלים', mock: true },
  { id: 'store-b', name: 'סטודיו לדוגמה', website: 'https://example.com/store-b', city: 'תל אביב-יפו', mock: true },
  { id: 'store-c', name: 'עיצוב לדוגמה', website: 'https://example.com/store-c', city: 'חיפה', mock: true },
  { id: 'store-d', name: 'חנות הדגמה', website: 'https://example.com/store-d', city: 'ראשון לציון', mock: true },
];

/** Hex values for the color tokens, used to tint the placeholder product images. */
export const COLOR_HEX: Record<string, string> = {
  black: '#2b2b2b',
  grey: '#9a9a96',
  white: '#f4f2ee',
  beige: '#dccbb2',
  cream: '#efe4d0',
  brown: '#7c5838',
  terracotta: '#c46a3c',
  natural: '#c9a77c',
  'light-wood': '#d8bf98',
  sage: '#9fb1a3',
  navy: '#2d3a4a',
  gold: '#c8a45d',
  'velvet-green': '#3f5a45',
  green: '#5f7d5a',
  mustard: '#d4a73a',
};

interface MockItem {
  sku: string;
  name: string;
  price: number;
  store: Store['id'];
  colors: string[];
  materials: string[];
  styles: Style[];
  availability?: Availability;
  rating?: number;
}

const s = (...styles: Style[]) => styles;

export const MOCK_ITEMS: Record<ProductCategory, MockItem[]> = {
  rug: [
    { sku: 'rug-1', name: 'שטיח שאגי בגוון שמנת 160×230', price: 599, store: 'store-a', colors: ['cream'], materials: ['polyester'], styles: s('warm-modern', 'modern', 'boho'), rating: 4.5 },
    { sku: 'rug-2', name: 'שטיח קליעה טבעי מיוטה 160×230', price: 449, store: 'store-b', colors: ['natural'], materials: ['jute'], styles: s('boho', 'rustic', 'japandi', 'scandinavian'), rating: 4.3 },
    { sku: 'rug-3', name: 'שטיח גיאומטרי שחור-לבן 200×290', price: 899, store: 'store-c', colors: ['black', 'white'], materials: ['wool'], styles: s('modern', 'minimalist'), rating: 4.6 },
    { sku: 'rug-4', name: 'שטיח וינטג׳ בגווני טרקוטה 120×170', price: 289, store: 'store-d', colors: ['terracotta', 'beige'], materials: ['cotton'], styles: s('boho', 'warm-modern', 'classic'), rating: 4.1 },
    { sku: 'rug-5', name: 'שטיח צמר אפור בהיר 200×300', price: 1490, store: 'store-a', colors: ['grey'], materials: ['wool'], styles: s('scandinavian', 'minimalist', 'luxury'), rating: 4.8 },
    { sku: 'rug-6', name: 'שטיח ארוג בז׳ 140×200', price: 349, store: 'store-b', colors: ['beige'], materials: ['cotton'], styles: s('japandi', 'warm-modern', 'scandinavian'), availability: 'out_of_stock', rating: 4.2 },
  ],
  plant: [
    { sku: 'plant-1', name: 'עציץ קרמיקה לבן עם מונסטרה מלאכותית', price: 129, store: 'store-a', colors: ['white', 'green'], materials: ['ceramic'], styles: s('modern', 'warm-modern', 'scandinavian'), rating: 4.4 },
    { sku: 'plant-2', name: 'פיקוס כינורי בעציץ סלסלה, 120 ס״מ', price: 249, store: 'store-b', colors: ['green', 'natural'], materials: ['rattan'], styles: s('boho', 'rustic', 'warm-modern'), rating: 4.6 },
    { sku: 'plant-3', name: 'עציץ בטון אפור עם סנסווריה', price: 89, store: 'store-c', colors: ['grey', 'green'], materials: ['concrete'], styles: s('modern', 'minimalist', 'japandi'), rating: 4.2 },
    { sku: 'plant-4', name: 'זית בעציץ טרקוטה, 90 ס״מ', price: 179, store: 'store-d', colors: ['terracotta', 'green'], materials: ['terracotta'], styles: s('rustic', 'boho', 'classic'), rating: 4.5 },
    { sku: 'plant-5', name: 'עציץ רצפה מוזהב עם דקל', price: 399, store: 'store-a', colors: ['gold', 'green'], materials: ['metal'], styles: s('luxury', 'classic'), rating: 4.0 },
  ],
  'wall-art': [
    { sku: 'art-1', name: 'הדפס מופשט בגווני חום ושמנת 50×70', price: 189, store: 'store-b', colors: ['brown', 'cream', 'terracotta'], materials: ['paper', 'wood'], styles: s('warm-modern', 'boho', 'japandi'), rating: 4.5 },
    { sku: 'art-2', name: 'סט 3 הדפסי קו שחור 30×40', price: 149, store: 'store-c', colors: ['black', 'white'], materials: ['paper'], styles: s('modern', 'minimalist', 'scandinavian'), rating: 4.3 },
    { sku: 'art-3', name: 'תמונת קנבס נוף ים 60×90', price: 279, store: 'store-a', colors: ['navy', 'beige'], materials: ['canvas'], styles: s('classic', 'modern'), rating: 4.1 },
    { sku: 'art-4', name: 'מקרמה תלייה לקיר', price: 129, store: 'store-d', colors: ['cream', 'natural'], materials: ['cotton'], styles: s('boho', 'rustic'), rating: 4.4 },
    { sku: 'art-5', name: 'הדפס בוטני במסגרת עץ אלון 50×70', price: 229, store: 'store-b', colors: ['sage', 'light-wood'], materials: ['paper', 'oak'], styles: s('scandinavian', 'japandi', 'warm-modern'), rating: 4.7 },
  ],
  curtain: [
    { sku: 'curtain-1', name: 'זוג וילונות פשתן בהירים 140×260', price: 249, store: 'store-a', colors: ['cream', 'beige'], materials: ['linen'], styles: s('warm-modern', 'scandinavian', 'japandi', 'minimalist'), rating: 4.5 },
    { sku: 'curtain-2', name: 'וילון האפלה אפור כהה 140×260', price: 199, store: 'store-c', colors: ['grey'], materials: ['polyester'], styles: s('modern', 'minimalist'), rating: 4.2 },
    { sku: 'curtain-3', name: 'זוג וילונות קטיפה ירוקה 140×280', price: 459, store: 'store-b', colors: ['velvet-green'], materials: ['velvet'], styles: s('luxury', 'classic'), rating: 4.6 },
    { sku: 'curtain-4', name: 'וילון כותנה עם גדילים 140×250', price: 179, store: 'store-d', colors: ['natural', 'cream'], materials: ['cotton'], styles: s('boho', 'rustic'), rating: 4.0 },
  ],
  lamp: [
    { sku: 'lamp-1', name: 'מנורת רצפה עם אהיל פשתן', price: 349, store: 'store-a', colors: ['beige', 'black'], materials: ['linen', 'metal'], styles: s('warm-modern', 'scandinavian', 'japandi'), rating: 4.4 },
    { sku: 'lamp-2', name: 'מנורת קשת שחורה מתכווננת', price: 549, store: 'store-c', colors: ['black'], materials: ['metal'], styles: s('modern', 'minimalist'), rating: 4.5 },
    { sku: 'lamp-3', name: 'מנורת שולחן קרמיקה טרקוטה', price: 199, store: 'store-b', colors: ['terracotta', 'cream'], materials: ['ceramic'], styles: s('boho', 'warm-modern'), rating: 4.3 },
    { sku: 'lamp-4', name: 'מנורת רצפה מוזהבת עם אהיל לבן', price: 699, store: 'store-d', colors: ['gold', 'white'], materials: ['brass'], styles: s('luxury', 'classic'), rating: 4.6 },
    { sku: 'lamp-5', name: 'מנורת נייר אורז עגולה', price: 159, store: 'store-a', colors: ['white', 'natural'], materials: ['paper', 'bamboo'], styles: s('japandi', 'scandinavian', 'minimalist'), rating: 4.2 },
  ],
  cushion: [
    { sku: 'cushion-1', name: 'זוג כריות בוקלה שמנת 45×45', price: 119, store: 'store-a', colors: ['cream'], materials: ['boucle'], styles: s('warm-modern', 'japandi', 'scandinavian'), rating: 4.6 },
    { sku: 'cushion-2', name: 'זוג כריות קטיפה חרדל 45×45', price: 99, store: 'store-b', colors: ['mustard'], materials: ['velvet'], styles: s('boho', 'luxury', 'warm-modern'), rating: 4.3 },
    { sku: 'cushion-3', name: 'זוג כריות פשתן אפורות 50×50', price: 89, store: 'store-c', colors: ['grey'], materials: ['linen'], styles: s('modern', 'minimalist', 'scandinavian'), rating: 4.1 },
    { sku: 'cushion-4', name: 'זוג כריות קילים צבעוניות 45×45', price: 139, store: 'store-d', colors: ['terracotta', 'mustard'], materials: ['wool'], styles: s('boho', 'rustic'), rating: 4.4 },
    { sku: 'cushion-5', name: 'זוג כריות סאטן כחול כהה 45×45', price: 159, store: 'store-a', colors: ['navy', 'gold'], materials: ['satin'], styles: s('luxury', 'classic'), rating: 4.0 },
  ],
  throw: [
    { sku: 'throw-1', name: 'שמיכת סריגה גסה בבז׳ 130×170', price: 149, store: 'store-b', colors: ['beige'], materials: ['acrylic'], styles: s('warm-modern', 'scandinavian', 'japandi'), rating: 4.5 },
    { sku: 'throw-2', name: 'פלד כותנה עם פרנזים', price: 119, store: 'store-d', colors: ['natural', 'terracotta'], materials: ['cotton'], styles: s('boho', 'rustic'), rating: 4.2 },
    { sku: 'throw-3', name: 'שמיכת צמר אפורה 130×180', price: 229, store: 'store-c', colors: ['grey'], materials: ['wool'], styles: s('modern', 'minimalist', 'luxury'), rating: 4.4 },
  ],
  'side-table': [
    { sku: 'side-1', name: 'שולחן צד עגול מעץ אלון', price: 299, store: 'store-a', colors: ['light-wood'], materials: ['oak'], styles: s('scandinavian', 'japandi', 'warm-modern'), rating: 4.5 },
    { sku: 'side-2', name: 'שולחן צד מתכת שחור', price: 199, store: 'store-c', colors: ['black'], materials: ['metal'], styles: s('modern', 'minimalist'), rating: 4.2 },
    { sku: 'side-3', name: 'שולחן צד ראטן קלוע', price: 249, store: 'store-b', colors: ['natural'], materials: ['rattan'], styles: s('boho', 'rustic'), rating: 4.3 },
    { sku: 'side-4', name: 'שולחן צד שיש ופליז', price: 549, store: 'store-d', colors: ['white', 'gold'], materials: ['marble', 'brass'], styles: s('luxury', 'classic'), rating: 4.7 },
  ],
  'coffee-table': [
    { sku: 'coffee-1', name: 'שולחן סלון עגול עץ אגוז 80 ס״מ', price: 799, store: 'store-a', colors: ['brown'], materials: ['walnut'], styles: s('warm-modern', 'japandi', 'classic'), rating: 4.6 },
    { sku: 'coffee-2', name: 'שולחן סלון לבן מבריק', price: 599, store: 'store-c', colors: ['white'], materials: ['mdf'], styles: s('modern', 'minimalist'), rating: 4.1 },
    { sku: 'coffee-3', name: 'שולחן סלון עץ ממוחזר', price: 949, store: 'store-b', colors: ['natural', 'brown'], materials: ['reclaimed-wood'], styles: s('rustic', 'boho'), rating: 4.4 },
    { sku: 'coffee-4', name: 'שולחן סלון אלון בהיר עם מדף', price: 699, store: 'store-d', colors: ['light-wood'], materials: ['oak'], styles: s('scandinavian', 'japandi'), rating: 4.5 },
  ],
  vase: [
    { sku: 'vase-1', name: 'אגרטל קרמיקה מחוספס בגוון חול', price: 79, store: 'store-a', colors: ['beige'], materials: ['ceramic'], styles: s('warm-modern', 'japandi', 'boho'), rating: 4.4 },
    { sku: 'vase-2', name: 'אגרטל זכוכית שקוף גבוה', price: 59, store: 'store-c', colors: ['white'], materials: ['glass'], styles: s('modern', 'minimalist', 'scandinavian'), rating: 4.2 },
    { sku: 'vase-3', name: 'אגרטל קרמיקה שחור מט', price: 89, store: 'store-b', colors: ['black'], materials: ['ceramic'], styles: s('modern', 'japandi', 'minimalist'), rating: 4.5 },
    { sku: 'vase-4', name: 'אגרטל פליז מעוצב', price: 189, store: 'store-d', colors: ['gold'], materials: ['brass'], styles: s('luxury', 'classic'), rating: 4.3 },
  ],
  mirror: [
    { sku: 'mirror-1', name: 'מראה עגולה במסגרת עץ 70 ס״מ', price: 329, store: 'store-a', colors: ['light-wood'], materials: ['oak', 'glass'], styles: s('scandinavian', 'japandi', 'warm-modern'), rating: 4.5 },
    { sku: 'mirror-2', name: 'מראה קשת במסגרת זהב 60×90', price: 449, store: 'store-d', colors: ['gold'], materials: ['metal', 'glass'], styles: s('luxury', 'classic', 'boho'), rating: 4.6 },
    { sku: 'mirror-3', name: 'מראה מלבנית שחורה 50×150', price: 279, store: 'store-c', colors: ['black'], materials: ['metal', 'glass'], styles: s('modern', 'minimalist'), rating: 4.2 },
  ],
  shelf: [
    { sku: 'shelf-1', name: 'מדף קיר צף עץ אלון 80 ס״מ', price: 149, store: 'store-a', colors: ['light-wood'], materials: ['oak'], styles: s('scandinavian', 'japandi', 'warm-modern'), rating: 4.3 },
    { sku: 'shelf-2', name: 'מדף מתכת שחור תעשייתי', price: 199, store: 'store-c', colors: ['black'], materials: ['metal'], styles: s('modern', 'rustic'), rating: 4.1 },
  ],
};
