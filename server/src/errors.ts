import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '@nice-home/shared';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, 'not_found', `No route for ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const httpError =
    err instanceof HttpError ? err : new HttpError(500, 'internal_error', 'Unexpected server error');
  if (httpError.status >= 500) {
    console.error(err);
  }
  const body: ApiErrorBody = { error: { code: httpError.code, message: httpError.message } };
  res.status(httpError.status).json(body);
};
