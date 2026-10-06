import { Router } from 'express';
import type { HealthResponse } from '@nice-home/shared';
import { config } from '../config';
import { isOnline } from '../connectivity';
import { mockParts, services } from '../services/registry';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const parts = mockParts();
  const body: HealthResponse = {
    status: 'ok',
    online: await isOnline(),
    engines: {
      productProviders: [...config.productProviders],
      analysis: config.analysisEngine,
      generation: config.generationEngine,
    },
    mock: parts.products || parts.analysis || parts.generation,
    mockParts: parts,
    sources: services.engine.status(),
  };
  res.json(body);
});
