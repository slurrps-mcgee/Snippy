import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../exceptions/custom-error';
import logger from '../utilities/logger';

export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // inside errorHandler, before `const statusCode = ...`
  if (!(err instanceof CustomError)) {
    // map common JWT/auth errors to 401
    if (err.name === 'UnauthorizedError' || err.name === 'JwtAuthenticationError' || 
      err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || (err as any).status === 401) {
      err = new CustomError('Invalid or expired token', 401);
    }
  }

  const statusCode = err instanceof CustomError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log error with stack trace (if available)
  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
  if (err.stack) {
    logger.debug(err.stack); // log stack trace separately at debug level
  }

  res.status(statusCode).json({ error: message });
};