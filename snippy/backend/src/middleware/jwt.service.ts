import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Custom middleware that verifies a JWT signed with the project's secret
// and attaches the decoded payload to req.auth.payload to match existing usage.
export default function jwtCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>;

    console.log('JWT payload:', payload);

    // ensure req.auth exists and attach payload similar to express-oauth2-jwt-bearer
    (req as any).auth = (req as any).auth || {};
    (req as any).auth.payload = payload;

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid token', details: err?.message });
  }
}