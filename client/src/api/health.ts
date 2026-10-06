import type { HealthResponse } from '@nice-home/shared';
import { apiRequest } from './client';

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health', { signal });
}
