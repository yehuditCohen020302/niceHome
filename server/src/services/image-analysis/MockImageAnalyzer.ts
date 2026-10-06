import type { Room, RoomAnalysis } from '@nice-home/shared';
import type { ImageAnalyzer } from './ImageAnalyzer';
import { ZONES } from './zones';

/**
 * MOCK: does not look at the photo. Zones describe a typical living-room photo taken
 * from a corner, facing the sofa. Returns the same generic zones for every room,
 * and detects no objects. Hotspots placed from these zones are approximate.
 * Replaced by a vision model in Phase 2.
 */
export class MockImageAnalyzer implements ImageAnalyzer {
  readonly id = 'mock';

  async analyze(room: Room): Promise<RoomAnalysis> {
    return {
      roomId: room.id,
      detectedObjects: [],
      freeZones: [
        { id: ZONES.floorCenter, x: 0.3, y: 0.74, width: 0.4, height: 0.18 },
        { id: ZONES.wallCenter, x: 0.36, y: 0.14, width: 0.28, height: 0.24 },
        { id: ZONES.cornerStart, x: 0.04, y: 0.42, width: 0.16, height: 0.4 },
        { id: ZONES.cornerEnd, x: 0.8, y: 0.4, width: 0.16, height: 0.42 },
        { id: ZONES.window, x: 0.68, y: 0.1, width: 0.26, height: 0.46 },
        { id: ZONES.sofa, x: 0.3, y: 0.46, width: 0.4, height: 0.16 },
        { id: ZONES.tableTop, x: 0.43, y: 0.64, width: 0.14, height: 0.08 },
      ],
      mock: true,
    };
  }
}
