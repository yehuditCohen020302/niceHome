import type { Design, DesignProductsResponse, GenerateDesignRequest } from '@nice-home/shared';
import { apiRequest } from './client';

export function generateDesign(roomId: string, signal?: AbortSignal): Promise<Design> {
  const body: GenerateDesignRequest = { roomId };
  return apiRequest<Design>('/designs/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}

export function getDesign(id: string, signal?: AbortSignal): Promise<Design> {
  return apiRequest<Design>(`/designs/${encodeURIComponent(id)}`, { signal });
}

export function getDesignProducts(id: string, signal?: AbortSignal): Promise<DesignProductsResponse> {
  return apiRequest<DesignProductsResponse>(`/designs/${encodeURIComponent(id)}/products`, { signal });
}
