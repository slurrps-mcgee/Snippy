import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const frontendRoot = path.resolve(process.cwd(), '../frontend');

function readFrontend(file: string): string {
  return fs.readFileSync(path.join(frontendRoot, file), 'utf8');
}

describe('nginx CSP for MinIO and snippet previews', () => {
  const csp = readFrontend('nginx-csp.inc');
  const minioConf = readFrontend('nginx.minio.conf');
  const noMinioConf = readFrontend('nginx.nominio.conf');

  it('allows snapshot capture and CDN assets without opening default-src', () => {
    expect(csp).toMatch(/connect-src[^"]*blob:/);
    expect(csp).toMatch(/connect-src[^"]*data:/);
    expect(csp).toMatch(/script-src[^"]*https:/);
    expect(csp).toMatch(/style-src[^"]*https:/);
    expect(csp).toMatch(/img-src[^"]*'self' data: blob: https:/);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('frame-ancestors $csp_frame_ancestors');
    expect(csp).not.toMatch(/default-src \*/);
  });

  it('uses shared app/embed header includes in both nginx site configs', () => {
    for (const conf of [minioConf, noMinioConf]) {
      expect(conf).toContain('include /etc/nginx/nginx-app-headers.inc;');
      expect(conf).toContain('include /etc/nginx/nginx-embed-headers.inc;');
      expect(conf).toContain('client_max_body_size 6m;');
      expect(conf).not.toContain('add_header Content-Security-Policy');
    }
  });

  it('keeps clickjacking protection on the app and allows embed framing', () => {
    const appHeaders = readFrontend('nginx-app-headers.inc');
    const embedHeaders = readFrontend('nginx-embed-headers.inc');
    expect(appHeaders).toContain('set $csp_frame_ancestors "\'self\'"');
    expect(appHeaders).toContain('X-Frame-Options "SAMEORIGIN"');
    expect(embedHeaders).toContain('set $csp_frame_ancestors "*"');
    expect(embedHeaders).not.toContain('X-Frame-Options');
  });
});
