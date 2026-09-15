import type { Response } from 'express';

/**
 * Headers for HTML that third-party sites may iframe (API embed document).
 * Strips Helmet clickjacking / CORP defaults that would block embedding.
 * 
 * Security: Applies CSP sandbox to isolate user-controlled JavaScript from
 * the application origin. The sandbox creates an opaque origin, preventing
 * access to same-origin resources (cookies, storage, API endpoints) while
 * still allowing scripts to execute for snippet functionality.
 */
export function applyPublicEmbedHeaders(res: Response): void {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  
  // CSP sandbox isolates the embed in an opaque origin to prevent XSS attacks
  // while preserving snippet functionality (scripts, forms, modals, etc.)
  // NOTE: allow-same-origin is intentionally OMITTED to enforce opaque origin
  res.setHeader(
    'Content-Security-Policy',
    "sandbox allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox; frame-ancestors *"
  );
}
