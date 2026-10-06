import { Router } from 'express';
import type { HealthResponse } from '@nice-home/shared';
import { config, isMockMode } from '../config';
import { isOnline } from '../connectivity';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    online: await isOnline(),
    engines: {
      productProviders: [...config.productProviders],
      analysis: config.analysisEngine,
      generation: config.generationEngine,
    },
    mock: isMockMode(),
  };
  res.json(body);
});
