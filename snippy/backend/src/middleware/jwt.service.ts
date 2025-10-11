import { auth } from 'express-oauth2-jwt-bearer';

/**
 * Auth0-only JWT verification middleware.
 * Expects incoming requests to present an "Authorization: Bearer <token>" header.
 * Validates signature with Auth0 JWKS and optionally checks audience.
 */

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE; // e.g. 'your-tenant.us.auth0.com'
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN; // expected audience (optional)


export const jwtCheck = auth({
  audience: AUTH0_AUDIENCE,
  issuerBaseURL: `https://${AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});