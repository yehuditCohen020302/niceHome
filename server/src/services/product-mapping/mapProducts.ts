import type { DesignItem, ProductSpec, RankedCandidate, RoomAnalysis } from '@nice-home/shared';

export interface SelectedProduct {
  spec: ProductSpec;
  ranked: RankedCandidate[];
}

/**
 * Links each selected product to a hotspot on the image.
 * Until image generation reports object positions, hotspots sit in the center of the
 * zone the planner chose. Items sharing a zone are spread diagonally across it, so their
 * hotspots stay apart even on a narrow phone screen.
 */
export function mapProducts(analysis: RoomAnalysis, selected: SelectedProduct[]): DesignItem[] {
  const zones = new Map(analysis.freeZones.map((zone) => [zone.id, zone]));
  const zoneCounts = new Map<string, number>();
  for (const { spec } of selected) {
    if (spec.placementZoneId) zoneCounts.set(spec.placementZoneId, (zoneCounts.get(spec.placementZoneId) ?? 0) + 1);
  }
  const zoneIndex = new Map<string, number>();

  return selected.map(({ spec, ranked }) => {
    const [best, ...alternatives] = ranked as [RankedCandidate, ...RankedCandidate[]];
    const zone = spec.placementZoneId ? zones.get(spec.placementZoneId) : undefined;

    let x = 0.5;
    let y = 0.5;
    if (zone) {
      const count = zoneCounts.get(zone.id) ?? 1;
      const index = zoneIndex.get(zone.id) ?? 0;
      zoneIndex.set(zone.id, index + 1);
      const position = (index + 1) / (count + 1);
      x = zone.x + zone.width * position;
      y = zone.y + zone.height * position;
    }

    return {
      specId: spec.id,
      productId: best.productId,
      matchScore: best.matchScore,
      alternatives,
      x: clamp(x),
      y: clamp(y),
      ...(zone ? { width: zone.width, height: zone.height } : {}),
      generatedObjectType: spec.category,
    };
  });
}

/** Keeps hotspots fully inside the image. */
const clamp = (value: number) => Math.min(0.97, Math.max(0.03, value));
