import type { UploadedImage } from '@nice-home/shared';
import { apiRequest } from './client';

export function uploadImage(file: File, signal?: AbortSignal): Promise<UploadedImage> {
  const body = new FormData();
  body.append('image', file);
  return apiRequest<UploadedImage>('/uploads', { method: 'POST', body, signal });
}
