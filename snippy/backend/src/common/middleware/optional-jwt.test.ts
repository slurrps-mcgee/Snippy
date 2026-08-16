import { describe, expect, it } from 'vitest';
import { isOptionalJwtGet } from './optional-jwt';

describe('isOptionalJwtGet', () => {
  it.each([
    '/api/v1/snippets/public',
    '/api/v1/snippets/search',
    '/api/v1/snippets/search?q=foo',
    '/api/v1/snippets/user/alice',
    '/api/v1/snippets/shared/abc',
    '/api/v1/snippets/abc123/embed',
    '/api/v1/snippets/abc123/forks',
    '/api/v1/snippets/abc123',
    '/api/v1/users/alice',
    '/api/v1/collections/user/alice',
    '/api/v1/collections/col123',
    '/api/v1/comments/snip-uuid',
  ])('allows GET %s', (url) => {
    expect(isOptionalJwtGet('GET', url)).toBe(true);
  });

  it.each([
    '/api/v1/snippets/me',
    '/api/v1/snippets/feed',
    '/api/v1/snippets/public/nope',
    '/api/v1/users/me',
    '/api/v1/users/check-username/alice',
    '/api/v1/users/alice/followers',
    '/api/v1/collections/me',
    '/api/v1/favorites',
  ])('requires JWT for GET %s', (url) => {
    expect(isOptionalJwtGet('GET', url)).toBe(false);
  });

  it('requires JWT for writes', () => {
    expect(isOptionalJwtGet('POST', '/api/v1/snippets/public')).toBe(false);
    expect(isOptionalJwtGet('POST', '/api/v1/comments/snip-uuid')).toBe(false);
    expect(isOptionalJwtGet('PUT', '/api/v1/snippets/abc123')).toBe(false);
  });
});
