import type { Room, RoomAnalysis } from '@nice-home/shared';

/** Understands the room photo: structure, existing furniture, free zones for new items. */
export interface ImageAnalyzer {
  readonly id: string;
  analyze(room: Room): Promise<RoomAnalysis>;
}
