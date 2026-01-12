import { Client } from 'minio';
import { config } from '../config/index';
import { dbConnectionPolicy } from '../common/utilities/resiliance';
import logger from '../common/utilities/logger';

export const minioClient = new Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

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