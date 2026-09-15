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
    expect(headers['Content-Security-Policy']).toBe(
      'sandbox allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox; frame-ancestors *'
    );
    expect(headers['X-Frame-Options']).toBeUndefined();
    expect(headers['Cross-Origin-Resource-Policy']).toBeUndefined();
    expect(headers['Cross-Origin-Opener-Policy']).toBeUndefined();
  });

  it('applies CSP sandbox without allow-same-origin to enforce opaque origin', () => {
    const headers: Record<string, string> = {};
    const res = {
      removeHeader: vi.fn(),
      setHeader: vi.fn((name: string, value: string) => {
        headers[name] = value;
      }),
    };

    applyPublicEmbedHeaders(res as any);

    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain('sandbox');
    expect(csp).toContain('allow-scripts');
    expect(csp).not.toContain('allow-same-origin');
    expect(csp).toContain('frame-ancestors *');
  });

  describe('XSS mitigation - stored XSS trust-boundary failure', () => {
    it('prevents same-origin access by omitting allow-same-origin from sandbox', () => {
      const headers: Record<string, string> = {};
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];
      // Critical security property: sandbox without allow-same-origin creates opaque origin
      // This prevents attacker-controlled JavaScript from accessing:
      // - Same-origin cookies (including session tokens)
      // - localStorage/sessionStorage
      // - Same-origin API endpoints
      expect(csp).toMatch(/^sandbox\s/);
      expect(csp).not.toContain('allow-same-origin');
    });

    it('allows scripts to execute while isolating them in opaque origin', () => {
      const headers: Record<string, string> = {};
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];
      // Scripts can execute (needed for snippet functionality)
      expect(csp).toContain('allow-scripts');
      // But they run in an opaque origin (no allow-same-origin)
      expect(csp).not.toContain('allow-same-origin');
      // This combination prevents XSS while preserving functionality
    });

    it('enforces sandbox directive before frame-ancestors to ensure proper parsing', () => {
      const headers: Record<string, string> = {};
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];
      const sandboxIndex = csp.indexOf('sandbox');
      const frameAncestorsIndex = csp.indexOf('frame-ancestors');

      // sandbox directive must come before frame-ancestors
      expect(sandboxIndex).toBeGreaterThan(-1);
      expect(frameAncestorsIndex).toBeGreaterThan(-1);
      expect(sandboxIndex).toBeLessThan(frameAncestorsIndex);
    });

    it('includes necessary sandbox flags for snippet functionality without compromising security', () => {
      const headers: Record<string, string> = {};
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];

      // Required for snippet functionality
      expect(csp).toContain('allow-scripts');
      expect(csp).toContain('allow-forms');
      expect(csp).toContain('allow-modals');
      expect(csp).toContain('allow-popups');
      expect(csp).toContain('allow-popups-to-escape-sandbox');

      // Security-critical: these must NOT be present
      expect(csp).not.toContain('allow-same-origin');
      expect(csp).not.toContain('allow-top-navigation');
    });

    it('prevents attacker from bypassing sandbox via CSP override', () => {
      const headers: Record<string, string> = {
        'Content-Security-Policy': "default-src 'unsafe-inline' 'unsafe-eval' *",
      };
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];
      // The sandbox directive must be present and properly configured
      // even if a previous CSP was set
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');
      expect(csp).not.toContain('unsafe-inline');
      expect(csp).not.toContain('unsafe-eval');
    });
  });

  describe('Pentest reproduction scenario mitigation', () => {
    it('mitigates stored XSS by creating opaque origin for attacker-controlled JavaScript', () => {
      const headers: Record<string, string> = {};
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];

      // Pentest finding: "The attacker's script can access same-origin resources"
      // Mitigation: sandbox without allow-same-origin creates opaque origin
      expect(csp).toMatch(/sandbox(?!.*allow-same-origin)/);

      // Pentest finding: "can issue or read same-origin requests in the victim's browser session"
      // Mitigation: opaque origin prevents same-origin fetch/XHR
      const sandboxMatch = csp.match(/sandbox\s+([^;]+)/);
      expect(sandboxMatch).toBeTruthy();
      const sandboxFlags = sandboxMatch![1];
      expect(sandboxFlags).not.toContain('allow-same-origin');
    });

    it('allows embedding while preventing origin-based attacks', () => {
      const headers: Record<string, string> = {};
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];

      // Pentest requirement: "third-party sites may iframe"
      expect(csp).toContain('frame-ancestors *');

      // Security requirement: scripts execute in isolated context
      expect(csp).toContain('sandbox');
      expect(csp).toContain('allow-scripts');
      expect(csp).not.toContain('allow-same-origin');
    });

    it('prevents access to readable web storage mentioned in pentest finding', () => {
      const headers: Record<string, string> = {};
      const res = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(res as any);

      const csp = headers['Content-Security-Policy'];

      // Pentest finding: "access same-origin resources exposed to JavaScript,
      // including readable web storage"
      // Mitigation: Without allow-same-origin, the embed has a unique opaque origin
      // and cannot access the application's localStorage/sessionStorage
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');

      // Verify the CSP is properly formatted
      expect(csp).toMatch(/^sandbox\s+[^;]+;\s*frame-ancestors\s+\*/);
    });
  });
});
