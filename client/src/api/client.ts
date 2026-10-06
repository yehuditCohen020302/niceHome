import type { ApiErrorBody } from '@nice-home/shared';

/**
 * Error thrown by the API client.
 * `status` is 0 when the local server could not be reached at all.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }

  get isServerUnreachable(): boolean {
    return this.status === 0;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'server_unreachable', 'Local server is not reachable');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    // The Vite proxy answers 5xx without a JSON body when the local server is down.
    if (!error && response.status >= 500) {
      throw new ApiError(0, 'server_unreachable', 'Local server is not reachable');
    }
    throw new ApiError(
      response.status,
      error?.code ?? 'http_error',
      error?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return body as T;
}
