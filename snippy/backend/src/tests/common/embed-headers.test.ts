import { describe, expect, it, vi } from 'vitest';
import { applyPublicEmbedHeaders } from '../../common/utilities/embed-headers';

describe('applyPublicEmbedHeaders', () => {
  it('allows third-party framing and strips Helmet isolation headers', () => {
    const headers: Record<string, string> = {
      'X-Frame-Options': 'SAMEORIGIN',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'",
    };
    const res = {
      removeHeader: vi.fn((name: string) => {
        delete headers[name];
      }),
      setHeader: vi.fn((name: string, value: string) => {
        headers[name] = value;
      }),
    };

    applyPublicEmbedHeaders(res as any);

    expect(res.removeHeader).toHaveBeenCalledWith('X-Frame-Options');
    expect(res.removeHeader).toHaveBeenCalledWith('Cross-Origin-Resource-Policy');
    expect(res.removeHeader).toHaveBeenCalledWith('Cross-Origin-Opener-Policy');
    expect(headers['Content-Security-Policy']).toBe('frame-ancestors *');
    expect(headers['X-Frame-Options']).toBeUndefined();
    expect(headers['Cross-Origin-Resource-Policy']).toBeUndefined();
    expect(headers['Cross-Origin-Opener-Policy']).toBeUndefined();
  });
});
