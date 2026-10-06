import { Router } from 'express';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@nice-home/shared';
import { HttpError } from '../errors';
import { renderMockProductImage } from '../providers/mock/mockImages';

export const mockAssetsRouter = Router();

mockAssetsRouter.get('/products/:file', (req, res) => {
  const category = req.params.file.replace(/\.svg$/, '');
  if (!(PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
    throw new HttpError(404, 'not_found', 'Unknown mock image');
  }
  const color = typeof req.query.color === 'string' ? req.query.color : '';
  res
    .type('image/svg+xml')
    .set('Cache-Control', 'public, max-age=86400')
    .send(renderMockProductImage(category as ProductCategory, color));
});
