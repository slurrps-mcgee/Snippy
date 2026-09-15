import type { Response } from 'express';

/**
 * Headers for HTML that third-party sites may iframe (API embed document).
 * Strips Helmet clickjacking / CORP defaults that would block embedding.
 */
export function applyPublicEmbedHeaders(res: Response): void {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *');
}
