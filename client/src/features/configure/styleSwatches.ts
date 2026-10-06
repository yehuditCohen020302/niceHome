import type { StyleChoice } from '@nice-home/shared';

/** Three representative colors per style, shown as a small palette on each style card. */
export const STYLE_SWATCHES: Record<StyleChoice, readonly [string, string, string]> = {
  auto: ['#e9c9a3', '#8c9a8a', '#f4ece1'],
  modern: ['#2f2f2f', '#d9d9d6', '#ffffff'],
  'warm-modern': ['#b9773e', '#efe6da', '#5a4a3a'],
  minimalist: ['#f5f5f2', '#cfcac2', '#1f1f1f'],
  scandinavian: ['#e8dcc8', '#ffffff', '#9fb1a3'],
  classic: ['#6b4f3a', '#e9dfcf', '#2d3a4a'],
  rustic: ['#7c5838', '#c9a77c', '#3f4a36'],
  luxury: ['#1f2b38', '#c8a45d', '#e9e3d6'],
  boho: ['#c46a3c', '#e6c27a', '#5f7d5a'],
  japandi: ['#d8cbb8', '#3a3129', '#9aa08c'],
};
