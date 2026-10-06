import type { ProductCategory } from '@nice-home/shared';

/**
 * Placeholder product drawings for mock products, tinted with the product's main color.
 * They are labeled as sample images so they are never mistaken for real product photos.
 */
const SHAPES: Record<ProductCategory, (c: string) => string> = {
  rug: (c) => `<ellipse cx="200" cy="215" rx="150" ry="70" fill="${c}"/><ellipse cx="200" cy="215" rx="122" ry="52" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="5"/>`,
  plant: (c) => `<path d="M150 230h100l-14 90h-72z" fill="${c}"/><path d="M200 230c-50-50-70-110-45-150 25 35 45 90 45 150zm0 0c12-75 50-130 95-135-6 60-45 115-95 135zm0 0c-20-65-6-140 26-175 18 50 12 125-26 175z" fill="#5f7d5a"/>`,
  'wall-art': (c) => `<rect x="110" y="80" width="180" height="220" rx="4" fill="#fbf8f3" stroke="#3a3129" stroke-width="8"/><path d="M135 260c35-55 70-70 95-50s45 15 55-25" stroke="${c}" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="250" cy="130" r="20" fill="${c}" fill-opacity=".6"/>`,
  curtain: (c) => `<rect x="90" y="70" width="220" height="10" rx="5" fill="#5a4a3a"/><path d="M100 80h90c-6 90-6 170 0 250h-90z" fill="${c}"/><path d="M210 80h90v250h-90c6-80 6-160 0-250z" fill="${c}"/>`,
  lamp: (c) => `<path d="M150 90h100l-22 80h-56z" fill="${c}"/><rect x="196" y="170" width="8" height="140" fill="#3a3129"/><rect x="160" y="305" width="80" height="12" rx="6" fill="#3a3129"/>`,
  cushion: (c) => `<rect x="95" y="120" width="210" height="170" rx="40" fill="${c}"/><path d="M120 205h160" stroke="#fff" stroke-opacity=".35" stroke-width="5"/>`,
  throw: (c) => `<path d="M100 110h200v170c-30 15-170 15-200 0z" fill="${c}"/><path d="M100 140h200M100 175h200M100 210h200M100 245h200" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>`,
  'side-table': (c) => `<ellipse cx="200" cy="150" rx="95" ry="22" fill="${c}"/><rect x="194" y="160" width="12" height="130" fill="${c}"/><ellipse cx="200" cy="295" rx="55" ry="12" fill="${c}"/>`,
  'coffee-table': (c) => `<rect x="80" y="170" width="240" height="22" rx="11" fill="${c}"/><rect x="105" y="192" width="14" height="90" fill="${c}"/><rect x="281" y="192" width="14" height="90" fill="${c}"/>`,
  vase: (c) => `<path d="M170 110h60c0 30 35 55 35 115 0 60-30 90-65 90s-65-30-65-90c0-60 35-85 35-115z" fill="${c}"/>`,
  mirror: (c) => `<circle cx="200" cy="190" r="110" fill="${c}"/><circle cx="200" cy="190" r="92" fill="#e9eef0"/><path d="M150 160l40-40M160 200l60-60" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
  shelf: (c) => `<rect x="80" y="200" width="240" height="18" rx="4" fill="${c}"/><rect x="110" y="140" width="30" height="60" fill="#9aa08c"/><circle cx="270" cy="178" r="22" fill="#e3b788"/>`,
};

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function renderMockProductImage(category: ProductCategory, color: string): string {
  const fill = HEX_PATTERN.test(color) ? color : '#c9a77c';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<rect width="400" height="400" fill="#f4efe8"/>
${SHAPES[category](fill)}
<rect x="130" y="350" width="140" height="30" rx="15" fill="#2f2a24" fill-opacity=".75"/>
<text x="200" y="370" font-family="Heebo, Arial, sans-serif" font-size="15" fill="#fff" text-anchor="middle">תמונת דוגמה</text>
</svg>`;
}
