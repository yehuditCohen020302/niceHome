import type {
  ProductCategory,
  ProductSpec,
  Room,
  RoomAnalysis,
  RoomConstraint,
  Style,
  UpgradeGoal,
} from '@nice-home/shared';
import { newId } from '../../storage/ids';
import { ZONES } from '../image-analysis/zones';
import type { DesignPlan, DesignPlanner } from './DesignPlanner';

/** Categories each goal asks for, most important first. */
const GOAL_CATEGORIES: Record<UpgradeGoal, ProductCategory[]> = {
  'small-upgrade': ['cushion', 'plant', 'throw'],
  'style-change': ['rug', 'wall-art', 'cushion', 'lamp'],
  accessories: ['vase', 'cushion', 'throw'],
  lighting: ['lamp'],
  curtains: ['curtain'],
  rug: ['rug'],
  'wall-art': ['wall-art'],
  plants: ['plant'],
  cushions: ['cushion'],
  tables: ['coffee-table', 'side-table'],
  // Free-text goals need language understanding; the rule-based planner cannot act on them.
  other: [],
};

/**
 * Categories that would touch something the user marked as "must not change".
 * Conservative on purpose: hanging art or a mirror means drilling into a protected wall.
 */
const BLOCKED_BY_CONSTRAINT: Partial<Record<RoomConstraint, ProductCategory[]>> = {
  table: ['coffee-table'],
  walls: ['wall-art', 'mirror'],
  windows: ['curtain'],
};

/** Where each category goes in the room, in order of preference. */
const CATEGORY_ZONES: Record<ProductCategory, string[]> = {
  rug: [ZONES.floorCenter],
  'coffee-table': [ZONES.floorCenter],
  curtain: [ZONES.window],
  lamp: [ZONES.cornerEnd, ZONES.cornerStart],
  'side-table': [ZONES.cornerStart, ZONES.cornerEnd],
  'wall-art': [ZONES.wallCenter],
  mirror: [ZONES.wallCenter],
  shelf: [ZONES.wallCenter],
  plant: [ZONES.cornerStart, ZONES.cornerEnd],
  cushion: [ZONES.sofa],
  throw: [ZONES.sofa],
  vase: [ZONES.tableTop],
};

const STYLE_COLORS: Record<Style, string[]> = {
  modern: ['black', 'grey', 'white'],
  'warm-modern': ['beige', 'cream', 'brown', 'terracotta'],
  minimalist: ['white', 'beige', 'grey'],
  scandinavian: ['white', 'natural', 'light-wood', 'sage'],
  classic: ['brown', 'cream', 'navy', 'gold'],
  rustic: ['brown', 'natural', 'green'],
  luxury: ['gold', 'navy', 'velvet-green', 'cream'],
  boho: ['terracotta', 'mustard', 'green', 'natural'],
  japandi: ['natural', 'beige', 'black', 'sage'],
};

/** Used when the user picked "choose for me": a broadly liked, budget-friendly default. */
const AUTO_STYLE: Style = 'warm-modern';
const MAX_ITEMS = 6;

/**
 * Deterministic rules, not AI. Maps goals to product categories, drops anything that
 * conflicts with protected items, and orders the result by priority.
 * Replaced by an LLM planner in Phase 2.
 */
export class RuleBasedPlanner implements DesignPlanner {
  readonly id = 'rules';

  async plan(room: Room, analysis: RoomAnalysis): Promise<DesignPlan> {
    const style = room.style === 'auto' ? AUTO_STYLE : room.style;
    const blocked = new Set(room.constraints.flatMap((constraint) => BLOCKED_BY_CONSTRAINT[constraint] ?? []));

    // Interleave goals: take the top category of every goal before the second of any,
    // so each goal the user chose is represented even when the item cap is reached.
    const perGoal = room.goals.map((goal) => GOAL_CATEGORIES[goal].filter((category) => !blocked.has(category)));
    const categories: ProductCategory[] = [];
    for (let rank = 0; categories.length < MAX_ITEMS; rank++) {
      const atRank = perGoal.map((list) => list[rank]).filter((category) => category !== undefined);
      if (atRank.length === 0) break;
      for (const category of atRank) {
        if (!categories.includes(category) && categories.length < MAX_ITEMS) categories.push(category);
      }
    }

    const zoneIds = new Set(analysis.freeZones.map((zone) => zone.id));
    const usedZones = new Set<string>();
    const specs: ProductSpec[] = categories.map((category) => {
      const zones = CATEGORY_ZONES[category].filter((zone) => zoneIds.has(zone));
      const zone = zones.find((candidate) => !usedZones.has(candidate)) ?? zones[0];
      if (zone) usedZones.add(zone);
      return {
        id: newId(),
        category,
        description: `${category} in ${style} style for a living room`,
        style,
        colors: STYLE_COLORS[style],
        ...(zone ? { placementZoneId: zone } : {}),
      };
    });

    return { style, specs };
  }
}
