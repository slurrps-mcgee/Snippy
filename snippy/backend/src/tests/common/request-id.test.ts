import { describe, expect, it } from 'vitest';
import { sanitizeUrlForLogging } from '../../common/middleware/request-id';

describe('sanitizeUrlForLogging', () => {
  it('redacts share tokens from URL paths', () => {
    expect(sanitizeUrlForLogging('/api/v1/snippets/shared/abc123xyz')).toBe(
      '/api/v1/snippets/shared/[REDACTED]'
    );
  });

  it('redacts share tokens with query strings', () => {
    expect(sanitizeUrlForLogging('/api/v1/snippets/shared/token123?foo=bar')).toBe(
      '/api/v1/snippets/shared/[REDACTED]'
    );
  });

  it('preserves other snippet paths unchanged', () => {
    expect(sanitizeUrlForLogging('/api/v1/snippets/abc123')).toBe('/api/v1/snippets/abc123');
    expect(sanitizeUrlForLogging('/api/v1/snippets/public')).toBe('/api/v1/snippets/public');
    expect(sanitizeUrlForLogging('/api/v1/snippets/me')).toBe('/api/v1/snippets/me');
  });

  it('removes query strings from non-sensitive paths', () => {
    expect(sanitizeUrlForLogging('/api/v1/snippets/public?page=2')).toBe('/api/v1/snippets/public');
  });

  it('handles multiple share token patterns in the same URL', () => {
    // Edge case: if somehow multiple patterns exist
    expect(sanitizeUrlForLogging('/api/v1/snippets/shared/token1/snippets/shared/token2')).toBe(
      '/api/v1/snippets/shared/[REDACTED]/snippets/shared/[REDACTED]'
    );
  });

  it('handles trailing slashes', () => {
    expect(sanitizeUrlForLogging('/api/v1/snippets/shared/token123/')).toBe(
      '/api/v1/snippets/shared/[REDACTED]/'
    );
  });

  it('handles empty and root paths', () => {
    expect(sanitizeUrlForLogging('/')).toBe('/');
    expect(sanitizeUrlForLogging('')).toBe('');
  });

  // Security-focused tests for pentest finding mitigation
  describe('bearer token redaction (pentest mitigation)', () => {
    it('prevents bearer token leakage in logs - nanoid(21) format', () => {
      // Simulates the actual nanoid(21) token format used in production
      const token = 'V1StGXR8_Z5jdHi6B-myT'; // 21 character nanoid
      const url = `/api/v1/snippets/shared/${token}`;
      const sanitized = sanitizeUrlForLogging(url);

      // Assert token is NOT present in sanitized output
      expect(sanitized).not.toContain(token);
      expect(sanitized).toBe('/api/v1/snippets/shared/[REDACTED]');
    });

    it('redacts tokens from complete request URLs with query parameters', () => {
      // Reproduction Step 1: originalUrl.split('?')[0] should not expose token
      const token = 'abc123xyz789token456';
      const url = `/api/v1/snippets/shared/${token}?format=json&include=metadata`;
      const sanitized = sanitizeUrlForLogging(url);

      expect(sanitized).not.toContain(token);
      expect(sanitized).toBe('/api/v1/snippets/shared/[REDACTED]');
    });

    it('redacts tokens from error handler paths (originalUrl unchanged)', () => {
      // Reproduction Step 2: error handler records complete originalUrl
      const token = 'sensitive_bearer_token_xyz';
      const url = `/api/v1/snippets/shared/${token}`;
      const sanitized = sanitizeUrlForLogging(url);

      expect(sanitized).not.toContain(token);
      expect(sanitized).toBe('/api/v1/snippets/shared/[REDACTED]');
    });

    it('ensures no token substring remains in sanitized output', () => {
      const token = 'V1StGXR8_Z5jdHi6B-myT';
      const url = `/api/v1/snippets/shared/${token}`;
      const sanitized = sanitizeUrlForLogging(url);

      // Verify no part of the token is present
      for (let i = 0; i < token.length - 2; i++) {
        const substring = token.substring(i, i + 3);
        expect(sanitized).not.toContain(substring);
      }
    });

    it('redacts tokens with special characters and URL encoding', () => {
      // Test with various token formats that might appear
      const tokens = [
        'V1StGXR8_Z5jdHi6B-myT', // nanoid with special chars
        'abc123def456ghi789jkl', // alphanumeric
        'token-with-dashes-here', // dashes
        'token_with_underscores', // underscores
        'MixedCase123Token456', // mixed case
      ];

      tokens.forEach((token) => {
        const url = `/api/v1/snippets/shared/${token}`;
        const sanitized = sanitizeUrlForLogging(url);
        expect(sanitized).not.toContain(token);
        expect(sanitized).toBe('/api/v1/snippets/shared/[REDACTED]');
      });
    });

    it('prevents replay attack by ensuring tokens are not logged', () => {
      // Simulates the security scenario: attacker with log access should not get reusable tokens
      const reusableToken = 'V1StGXR8_Z5jdHi6B-myT';
      const successfulRequestUrl = `/api/v1/snippets/shared/${reusableToken}`;

      const sanitized = sanitizeUrlForLogging(successfulRequestUrl);

      // Critical: token must be completely redacted to prevent replay
      expect(sanitized).toBe('/api/v1/snippets/shared/[REDACTED]');
      expect(sanitized).not.toContain(reusableToken);
    });

    it('handles tokens in paths with additional segments', () => {
      // Edge case: ensure we only redact the token, not other path segments
      const token = 'mytoken123';
      const url = `/api/v1/snippets/shared/${token}/extra/path`;
      const sanitized = sanitizeUrlForLogging(url);

      expect(sanitized).not.toContain(token);
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).toContain('/extra/path');
    });

    it('redacts very long tokens (edge case)', () => {
      // Test with unusually long token
      const longToken = 'a'.repeat(100);
      const url = `/api/v1/snippets/shared/${longToken}`;
      const sanitized = sanitizeUrlForLogging(url);

      expect(sanitized).not.toContain(longToken);
      expect(sanitized).toBe('/api/v1/snippets/shared/[REDACTED]');
    });

    it('redacts single character tokens (edge case)', () => {
      // Test with minimal token
      const shortToken = 'x';
      const url = `/api/v1/snippets/shared/${shortToken}`;
      const sanitized = sanitizeUrlForLogging(url);

      expect(sanitized).not.toContain(shortToken);
      expect(sanitized).toBe('/api/v1/snippets/shared/[REDACTED]');
    });
  });

  describe('log safety verification', () => {
    it('ensures sanitized output is safe for all log transports', () => {
      // Verify output is safe for console, file, and rotating file transports
      const token = 'V1StGXR8_Z5jdHi6B-myT';
      const url = `/api/v1/snippets/shared/${token}`;
      const sanitized = sanitizeUrlForLogging(url);

      // Should be safe to log anywhere
      expect(sanitized).toMatch(/^\/api\/v1\/snippets\/shared\/\[REDACTED\]$/);
      expect(sanitized).not.toMatch(/[A-Za-z0-9_-]{21}/); // No nanoid pattern
    });

    it('maintains consistent redaction format across all requests', () => {
      // All tokens should be redacted to the same placeholder
      const tokens = ['token1', 'token2', 'differentToken', 'V1StGXR8_Z5jdHi6B-myT'];
      const sanitizedResults = tokens.map((token) =>
        sanitizeUrlForLogging(`/api/v1/snippets/shared/${token}`)
      );

      // All should produce identical output
      const uniqueResults = new Set(sanitizedResults);
      expect(uniqueResults.size).toBe(1);
      expect(uniqueResults.has('/api/v1/snippets/shared/[REDACTED]')).toBe(true);
    });
  });
});
