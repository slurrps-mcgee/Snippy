import rateLimit from 'express-rate-limit';
import { config } from '../../config';

/**
 * Rate limiter for public read operations (GET requests)
 * Higher limit to accommodate browsing and searching
 */
export const publicReadLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.publicReads,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'GET',
});

/**
 * Rate limiter for write operations (POST, PUT, PATCH, DELETE)
 * Lower limit to prevent abuse
 */
export const writeLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.writes,
    message: 'Too many write requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET',
});

/**
 * Rate limiter for authentication-related endpoints
 * Strictest limit to prevent brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: config.rateLimit.authWindowMs,
    max: config.rateLimit.auth,
    message: 'Too many authentication attempts from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for search operations
 * Moderate limit to prevent search abuse while allowing legitimate use
 */
export const searchLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.search,
    message: 'Too many search requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Global fallback rate limiter
 * Applied as a baseline to all routes
 */
export const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.global,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
