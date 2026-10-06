import type { ProductCategory, RoomConstraint } from '@nice-home/shared';
import { ZONES } from '../image-analysis/zones';
import type { GenerationItem } from './ImageGenerator';

/**
 * Where each zone is in the photo, in words the model understands. Must agree with the zone
 * boxes (left/right are physical image sides) so hotspots land near the rendered items.
 */
const ZONE_PLACEMENT: Record<string, string> = {
  [ZONES.floorCenter]: 'on the floor in the middle of the room, in front of the sofa',
  [ZONES.wallCenter]: 'on the main wall, centered above the sofa',
  [ZONES.cornerStart]: 'in the left part of the room, near the left corner',
  [ZONES.cornerEnd]: 'in the right part of the room, near the right corner',
  [ZONES.window]: 'on the window, framing it',
  [ZONES.sofa]: 'on the sofa',
  [ZONES.tableTop]: 'on the coffee table',
};

const CATEGORY_NAMES: Record<ProductCategory, string> = {
  rug: 'rug',
  plant: 'plant pot / planter',
  'wall-art': 'wall art',
  curtain: 'curtains',
  lamp: 'lamp',
  cushion: 'decorative cushion',
  throw: 'throw blanket',
  'side-table': 'side table',
  'coffee-table': 'coffee table',
  vase: 'vase',
  mirror: 'mirror',
  shelf: 'wall shelf',
};

const CONSTRAINT_NAMES: Record<RoomConstraint, string> = {
  sofa: 'the sofa',
  table: 'the existing table',
  tv: 'the TV',
  cabinets: 'the cabinets',
  walls: 'the walls (color, texture and everything on them)',
  floor: 'the floor',
  windows: 'the windows',
  doors: 'the doors',
};

/**
 * Instructions for an image-editing model. Image 1 is the user's photo; images 2..n are the
 * products, in the same order as `items`. The goal is "this is my living room", with exactly
 * these real products added — nothing invented.
 */
export function buildPrompt(items: GenerationItem[], constraints: RoomConstraint[]): string {
  const protectedItems = constraints.map((constraint) => CONSTRAINT_NAMES[constraint]);
  const productLines = items.map(({ product, spec }, index) => {
    const placement = (spec.placementZoneId && ZONE_PLACEMENT[spec.placementZoneId]) ?? 'where it naturally fits';
    return `- Image ${index + 2}: ${CATEGORY_NAMES[spec.category]} ("${product.name}") — place it ${placement}.`;
  });

  return [
    'Image 1 is a real photo of a living room. Edit this exact photo; do not create a different room.',
    '',
    'Keep exactly the same: camera angle and framing, room layout and proportions, walls, windows, doors, floor, ceiling, light direction, and all existing furniture.',
    protectedItems.length > 0
      ? `These must stay completely unchanged, as in the original photo: ${protectedItems.join(', ')}.`
      : '',
    '',
    'Add only the following real products. Each must match its reference image exactly — same shape, color, material and pattern — at a realistic size for this room:',
    ...productLines,
    '',
    'If an older item of the same kind is already in that spot (for example an old rug), replace it with the new one.',
    'Do not add, remove or change anything else. No text, labels or watermarks.',
    'Photorealistic, with lighting and shadows consistent with the original photo.',
  ]
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n');
}
