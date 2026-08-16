import { Client } from 'minio';
import { config, featureFlags } from '../config/index';
import { dbConnectionPolicy } from '../common/utilities/resilience';
import logger from '../common/utilities/logger';

export const minioClient = new Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

export function isMinioConnectionError(err: unknown): boolean {
  const e = err as { code?: string; message?: string; name?: string };
  const code = e?.code ?? '';
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'EPIPE', 'EHOSTUNREACH'].includes(code)) {
    return true;
  }
  const message = String(e?.message ?? '');
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|connect ECONNREFUSED|getaddrinfo|socket hang up|not reachable/i.test(message);
}

/** Latch MinIO off until this API process restarts. */
export function latchMinioUnavailable(reason: unknown): void {
  if (!featureFlags.isMinioAvailable) return;
  featureFlags.isMinioAvailable = false;
  logger.error('MinIO latched off until API restart', reason);
}

export async function connectMinioWithRetry(): Promise<void> {
  await dbConnectionPolicy.execute(async () => {
    logger.info('⏳ Trying MinIO connection...');

    // Lightweight health check
    await minioClient.listBuckets();

    logger.info('✅ MinIO connected.');

    // Validate bucket exists
    const exists = await minioClient.bucketExists(config.minio.bucket);
    if (!exists) {
      throw new Error(`MinIO bucket "${config.minio.bucket}" does not exist`);
    }

    logger.info(`✅ MinIO bucket "${config.minio.bucket}" verified.`);
  });
}