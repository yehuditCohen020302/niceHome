import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { MAX_UPLOAD_BYTES, type UploadedImage } from '@nice-home/shared';
import { HttpError } from '../errors';
import { findGenerated } from '../storage/generated';
import { detectImageType, findUpload, saveUpload } from '../storage/uploads';

export const uploadsRouter = Router();

const parseImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
}).single('image');

/** Runs multer and translates its errors into API errors. */
const receiveImage: RequestHandler = (req, res, next) => {
  parseImage(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new HttpError(413, 'file_too_large', 'Image exceeds the maximum upload size'));
    }
    if (error instanceof multer.MulterError) {
      return next(new HttpError(400, 'invalid_upload', error.message));
    }
    next(error);
  });
};

uploadsRouter.post('/', receiveImage, async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new HttpError(400, 'missing_image', 'Expected an "image" file field');
  }

  const contentType = detectImageType(file.buffer);
  if (!contentType) {
    throw new HttpError(415, 'unsupported_image_type', 'Only JPEG, PNG and WebP images are supported');
  }

  const id = await saveUpload(file.buffer, contentType);
  const body: UploadedImage = {
    id,
    url: `/api/uploads/${id}`,
    contentType,
    sizeBytes: file.size,
  };
  res.status(201).json(body);
});

uploadsRouter.get('/:id', async (req, res) => {
  const filePath = await findUpload(req.params.id);
  if (!filePath) {
    throw new HttpError(404, 'upload_not_found', 'Image not found');
  }
  res.sendFile(filePath, { headers: { 'Cache-Control': 'private, max-age=31536000, immutable' } });
});

/** Visualizations created by the image generator. */
export const generatedRouter = Router();

generatedRouter.get('/:id', async (req, res) => {
  const filePath = await findGenerated(req.params.id);
  if (!filePath) {
    throw new HttpError(404, 'generated_not_found', 'Image not found');
  }
  res.sendFile(filePath, { headers: { 'Cache-Control': 'private, max-age=31536000, immutable' } });
});
