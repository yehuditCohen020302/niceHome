import type { GenerationResult, ImageGenerator } from './ImageGenerator';

/**
 * MOCK: generates nothing. The UI shows the original photo with hotspots and says
 * plainly that no visualization was created. Replaced by a real model in Phase 3.
 */
export class MockImageGenerator implements ImageGenerator {
  readonly id = 'mock';

  async generate(): Promise<GenerationResult> {
    return { imageUrl: null };
  }
}
