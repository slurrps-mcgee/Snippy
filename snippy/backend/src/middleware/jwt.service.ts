import { auth } from 'express-oauth2-jwt-bearer';

/**
 * Auth0-only JWT verification middleware.
 * Expects incoming requests to present an "Authorization: Bearer <token>" header.
 * Validates signature with Auth0 JWKS and optionally checks audience.
 */

const AUDIENCE = process.env.AUDIENCE; // e.g. 'your-tenant.us.auth0.com'
const ISSUER_BASE_URL = process.env.ISSUER_BASE_URL; // expected audience (optional)

export const jwtCheck = auth({
  audience: AUDIENCE,
  issuerBaseURL: ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});