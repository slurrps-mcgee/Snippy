import { auth } from 'express-oauth2-jwt-bearer';
import { config } from '../../config';

/**
 * Auth0-only JWT verification middleware.
 * Expects incoming requests to present an "Authorization: Bearer <token>" header.
 * Validates signature with Auth0 JWKS and optionally checks audience.
 */
export const auth0Check = auth({
  audience: config.auth.audience,
  issuerBaseURL: `https://${config.auth.domain}/`,
  tokenSigningAlg: 'RS256'
});