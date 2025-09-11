import { Request, Response, NextFunction } from 'express';
import { CustomError } from './custom-error';
import logger from './logger';

export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err instanceof CustomError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log error with stack trace (if available)
  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
  if (err.stack) {
    logger.debug(err.stack); // log stack trace separately at debug level
  }

  res.status(statusCode).json({ error: message });
};
