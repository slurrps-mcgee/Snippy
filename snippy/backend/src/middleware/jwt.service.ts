import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Custom middleware that verifies a JWT signed with the project's secret
// and attaches the decoded payload to req.auth.payload to match existing usage.
export default function jwtCheck(req: Request, res: Response, next: NextFunction) {
  try {
    // Read token from cookie instead of Authorization header
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ error: 'Missing token cookie' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>;

    console.log('JWT payload:', payload);

    // attach payload to req.auth.payload
    (req as any).auth = (req as any).auth || {};
    (req as any).auth.payload = payload;

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid token', details: err?.message });
  }
}