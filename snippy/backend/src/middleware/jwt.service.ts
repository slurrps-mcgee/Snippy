import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/custom-error';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'secret';

// Custom middleware that verifies a JWT signed with the project's secret
// and attaches the decoded payload to req.auth.payload to match existing usage.
export function jwtCheck(req: Request, res: Response, next: NextFunction) {
  try {
    // Read token from cookie instead of Authorization header
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ error: 'Missing token cookie' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>;

    // attach payload to req.auth.payload
    (req as any).auth = (req as any).auth || {};
    (req as any).auth.payload = payload;

    return next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid token', details: err?.message });
  }
}

// Helper functions to create and refresh tokens
export function createTokens(payload: any) {
  const ACCESS_TOKEN_EXPIRES = '15m';
  const REFRESH_TOKEN_EXPIRES = '7d';

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });

  return { accessToken, refreshToken };
}

export function refreshTokens(refreshToken: string) {
  const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
  if (typeof decoded !== 'object' || decoded === null || !('sub' in decoded) || !('email' in decoded)) {
    throw new CustomError('Invalid refresh token payload', 401);
  }

  const { accessToken, refreshToken: newRefresh } = createTokens({ sub: decoded.sub, email: decoded.email });

  return { accessToken, refreshToken: newRefresh };
}