/**
 * GET paths that accept a missing/invalid JWT (identity is attached when present).
 * Writes and personal feeds still require Auth0.
 */
const OPTIONAL_JWT_GET_PATTERNS: readonly RegExp[] = [
  /^\/api\/v1\/snippets\/public\/?$/,
  /^\/api\/v1\/snippets\/search\/?$/,
  /^\/api\/v1\/snippets\/user\/[^/]+\/?$/,
  /^\/api\/v1\/snippets\/shared\/[^/]+\/?$/,
  /^\/api\/v1\/snippets\/[^/]+\/embed\/?$/,
  /^\/api\/v1\/snippets\/[^/]+\/forks\/?$/,
  /^\/api\/v1\/snippets\/(?!(?:me|public|feed|search|user|shared)(?:\/|$))[^/]+\/?$/,
  /^\/api\/v1\/users\/(?!(?:me|picture|check-username)(?:\/|$))[^/]+\/?$/,
  /^\/api\/v1\/collections\/user\/[^/]+\/?$/,
  /^\/api\/v1\/collections\/(?!(?:me|user)(?:\/|$))[^/]+\/?$/,
  /^\/api\/v1\/comments\/[^/]+\/?$/,
];

export function isOptionalJwtGet(method: string, originalUrl: string): boolean {
  if (method !== 'GET') return false;
  const path = originalUrl.split('?')[0];
  return OPTIONAL_JWT_GET_PATTERNS.some((re) => re.test(path));
}
