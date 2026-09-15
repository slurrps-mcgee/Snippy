import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(process.cwd(), '../..');

function readRepo(file: string): string {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

describe('MinIO container images', () => {
  it('does not pull unpublished Docker Hub minio/mc or minio/minio tags', () => {
    const dockerfile = readRepo('snippy/minio/Dockerfile');
    const compose = readRepo('docker-compose.yml');
    const prodCompose = readRepo('docker-compose.prod.example.yml');

    expect(dockerfile).not.toMatch(/FROM\s+minio\/mc/);
    expect(dockerfile).toMatch(/FROM\s+cgr\.dev\/chainguard\/minio-client/);
    expect(compose).not.toMatch(/image:\s*minio\/minio/);
    expect(prodCompose).not.toMatch(/image:\s*minio\/minio/);
    expect(compose).toMatch(/image:\s*cgr\.dev\/chainguard\/minio/);
    expect(prodCompose).toMatch(/image:\s*cgr\.dev\/chainguard\/minio/);
  });
});
