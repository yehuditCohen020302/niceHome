/**
 * Ids of the room zones an analyzer reports and the planner places items into.
 * Every ImageAnalyzer implementation must use these ids.
 */
export const ZONES = {
  floorCenter: 'floor-center',
  wallCenter: 'wall-center',
  cornerStart: 'corner-start',
  cornerEnd: 'corner-end',
  window: 'window',
  sofa: 'sofa',
  tableTop: 'table-top',
} as const;
