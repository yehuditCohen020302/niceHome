import { Router } from 'express';
import { z } from 'zod';
import type { DesignProductsResponse } from '@nice-home/shared';
import { HttpError } from '../errors';
import { getJob, startDesignJob, startVisualizationJob } from '../jobs/designJobs';
import { generateDesign } from '../pipeline/generateDesign';
import { services } from '../services/registry';
import { NoProvidersAvailableError } from '../services/product-engine/ProductEngine';
import { getDesignRecord, saveDesign } from '../storage/designs';
import { isValidId } from '../storage/ids';
import { getRoom } from '../storage/rooms';

export const designsRouter = Router();

const generateSchema = z.object({ roomId: z.string().refine(isValidId, 'Invalid room id') });

async function roomFromBody(body: unknown) {
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_request', 'Expected { roomId }');
  }
  const room = await getRoom(parsed.data.roomId);
  if (!room) {
    throw new HttpError(404, 'room_not_found', 'Room not found');
  }
  return room;
}

/** Synchronous generation: returns the finished design. Useful for scripts and tests. */
designsRouter.post('/generate', async (req, res) => {
  const room = await roomFromBody(req.body);
  try {
    const record = await generateDesign(room, services);
    await saveDesign(record);
    res.status(201).json(record.design);
  } catch (error) {
    if (error instanceof NoProvidersAvailableError) {
      throw error.stillSyncing
        ? new HttpError(503, 'catalogs_syncing', 'Store catalogs are still downloading for the first time')
        : new HttpError(503, 'products_unavailable', 'No product source is reachable right now');
    }
    throw error;
  }
});

/** Background generation: returns a job to poll for real stage-by-stage progress. Used by the UI. */
designsRouter.post('/jobs', async (req, res) => {
  const room = await roomFromBody(req.body);
  res.status(202).json(startDesignJob(room));
});

designsRouter.get('/jobs/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) throw new HttpError(404, 'job_not_found', 'Job not found');
  res.json(job);
});

/** Creates (or retries) the visualization for an existing design. Returns a job to poll. */
designsRouter.post('/:id/visualize', async (req, res) => {
  const record = await getDesignRecord(req.params.id);
  if (!record) throw new HttpError(404, 'design_not_found', 'Design not found');
  if (services.generator.id === 'mock') {
    throw new HttpError(409, 'no_generator', 'No image generator is configured (set OPENAI_API_KEY in .env)');
  }
  if (record.design.items.length === 0) {
    throw new HttpError(409, 'nothing_to_visualize', 'This design has no products to show');
  }
  const room = await getRoom(record.design.roomId);
  if (!room) throw new HttpError(404, 'room_not_found', 'Room not found');
  res.status(202).json(startVisualizationJob(record, room));
});

designsRouter.get('/:id', async (req, res) => {
  const record = await getDesignRecord(req.params.id);
  if (!record) throw new HttpError(404, 'design_not_found', 'Design not found');
  res.json(record.design);
});

designsRouter.get('/:id/products', async (req, res) => {
  const record = await getDesignRecord(req.params.id);
  if (!record) throw new HttpError(404, 'design_not_found', 'Design not found');
  const body: DesignProductsResponse = { products: record.products, stores: record.stores };
  res.json(body);
});
