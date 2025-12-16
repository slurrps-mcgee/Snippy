import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../exceptions/custom-error';
import logger from './logger';

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

export function handleError(err: any, method: string): never {
	// Preserve already-mapped errors
	if (err instanceof CustomError) throw err;
	// Log original error at debug so we can inspect stack in logs
	logger.debug(`${method} error: ${err?.stack || err}`);
	// Map known Sequelize/DB error names to HTTP codes
	handleSequelizeError(err);
}

// Handle Sequelize errors and map to CustomError
function handleSequelizeError(err: any): never {
	const name = err?.name;

	if (name === "SequelizeUniqueConstraintError") {
		// Check if it's specifically a shortId constraint violation
		if (err?.fields?.shortId || err?.message?.includes('short_id')) {
			throw new CustomError("ShortId generation failed - please try again", 500);
		}
		throw new CustomError("Conflict: unique constraint violated", 409);
	}
	if (name === "SequelizeValidationError") {
		throw new CustomError(err.message || "Validation failed", 400);
	}
	if (name === "SequelizeForeignKeyConstraintError") {
		throw new CustomError("Invalid reference", 400);
	}

	console.error('Sequelize error:', err);
	throw new CustomError("Database error", 500);
}