import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../exceptions/custom-error';
import logger from '../utilities/logger';
import { sanitizeUrlForLogging } from './request-id';

export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // inside errorHandler, before `const statusCode = ...`
  if (!(err instanceof CustomError)) {
    const oauthStatus =
      (err as { statusCode?: number; status?: number }).statusCode ??
      (err as { status?: number }).status;
    if (
      err.name === 'UnauthorizedError' ||
      err.name === 'InvalidRequestError' ||
      err.name === 'InvalidTokenError' ||
      err.name === 'InsufficientScopeError' ||
      err.name === 'InvalidProofError' ||
      err.name === 'JwtAuthenticationError' ||
      err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError' ||
      oauthStatus === 401
    ) {
      const status = err.name === 'InsufficientScopeError' ? 403 : 401;
      err = new CustomError(err.message || 'Invalid or expired token', status);
    }
  }

  const statusCode = err instanceof CustomError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log error with stack trace (if available)
  logger.error('request_error', {
    requestId: req.requestId,
    method: req.method,
    path: sanitizeUrlForLogging(req.originalUrl),
    status: statusCode,
    message,
  });
  if (err.stack) {
    logger.debug(err.stack); // log stack trace separately at debug level
  }

  res.status(statusCode).json({ success: false, error: message });
};
