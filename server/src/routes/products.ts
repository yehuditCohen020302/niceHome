import { Router } from 'express';
import { z } from 'zod';
import { DEFAULT_COUNTRY, MAX_BUDGET, PRODUCT_CATEGORIES, STYLES } from '@nice-home/shared';
import { HttpError } from '../errors';
import { services } from '../services/registry';
import { NoProvidersAvailableError } from '../services/product-engine/ProductEngine';

export const productsRouter = Router();
export const storesRouter = Router();

const searchSchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES),
  maxPrice: z.coerce.number().positive().max(MAX_BUDGET).optional(),
  style: z.enum(STYLES).optional(),
  city: z.string().trim().max(60).optional(),
});

productsRouter.get('/search', async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(400, 'invalid_search', `${issue?.path.join('.') || 'query'}: ${issue?.message}`);
  }
  const { category, maxPrice, style, city } = parsed.data;
  try {
    const products = await services.engine.search({
      category,
      country: DEFAULT_COUNTRY,
      ...(maxPrice !== undefined ? { maxPrice } : {}),
      ...(style ? { style } : {}),
      ...(city ? { city } : {}),
    });
    res.json(products);
  } catch (error) {
    if (error instanceof NoProvidersAvailableError) {
      throw new HttpError(503, 'products_unavailable', 'No product source is reachable right now');
    }
    throw error;
  }
});

productsRouter.get('/:id', async (req, res) => {
  const product = await services.engine.getProduct(req.params.id);
  if (!product) throw new HttpError(404, 'product_not_found', 'Product not found');
  res.json(product);
});

storesRouter.get('/', async (_req, res) => {
  res.json(await services.engine.getStores());
});
