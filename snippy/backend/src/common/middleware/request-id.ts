import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import logger from '../utilities/logger';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Redacts sensitive bearer tokens from URL paths before logging.
 * Replaces share tokens in /snippets/shared/:token with [REDACTED].
 */
export function sanitizeUrlForLogging(url: string): string {
  // Remove query string first
  const pathOnly = url.split('?')[0];
  
  // Redact share tokens: /snippets/shared/:token -> /snippets/shared/[REDACTED]
  return pathOnly.replace(
    /\/snippets\/shared\/[^/]+/g,
    '/snippets/shared/[REDACTED]'
  );
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId = incoming && incoming.trim() ? incoming.trim().slice(0, 64) : randomUUID();
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export function requestLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now();
  res.on('finish', () => {
    logger.info('http_request', {
      requestId: req.requestId,
      method: req.method,
      path: sanitizeUrlForLogging(req.originalUrl),
      status: res.statusCode,
      durationMs: Date.now() - started,
    });
  });
  next();
}
