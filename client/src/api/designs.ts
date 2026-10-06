import type { Design, DesignJob, DesignProductsResponse, GenerateDesignRequest } from '@nice-home/shared';
import { apiRequest } from './client';

export function getDesign(id: string, signal?: AbortSignal): Promise<Design> {
  return apiRequest<Design>(`/designs/${encodeURIComponent(id)}`, { signal });
}

export function getDesignProducts(id: string, signal?: AbortSignal): Promise<DesignProductsResponse> {
  return apiRequest<DesignProductsResponse>(`/designs/${encodeURIComponent(id)}/products`, { signal });
}

/** Starts building a design in the background; poll the job for progress. */
export function startDesignJob(roomId: string, signal?: AbortSignal): Promise<DesignJob> {
  const body: GenerateDesignRequest = { roomId };
  return apiRequest<DesignJob>('/designs/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}

export function getDesignJob(jobId: string, signal?: AbortSignal): Promise<DesignJob> {
  return apiRequest<DesignJob>(`/designs/jobs/${encodeURIComponent(jobId)}`, { signal });
}

/** Creates (or retries) the visualization for an existing design; poll the job for progress. */
export function startVisualization(designId: string, signal?: AbortSignal): Promise<DesignJob> {
  return apiRequest<DesignJob>(`/designs/${encodeURIComponent(designId)}/visualize`, { method: 'POST', signal });
}
