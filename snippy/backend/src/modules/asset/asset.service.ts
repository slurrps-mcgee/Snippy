import path from 'path';
import { ServicePayload } from '../../common/interfaces/servicePayload.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { CustomError } from '../../common/exceptions/custom-error';
import logger from '../../common/utilities/logger';
import { minioClient, latchMinioUnavailable, isMinioConnectionError } from '../../database/minio';
import {
  ALLOWED_ASSET_MIME_TYPES,
  CreateAssetRequest,
  MAX_ASSET_SIZE_BYTES,
  isSystemSubFolder,
  snippetSnapshotObjectKey,
} from './dto/asset.dto';
import { executeInTransaction } from '../../common/utilities/transaction';
import {
  createAsset,
  deleteAsset,
  findAssetsByUserId,
  findByAssetId,
  findByObjectKey,
  countAssetUsageByNeedle,
} from './asset.repo';
import { config, featureFlags } from '../../config';
import { PaginationQuery, PaginationService } from '../../common/services/pagination.service';
import { AssetDTO } from './dto/asset.dto';
import { AssetMapper } from './asset.mapper';

function sanitizeFileName(originalName: string): string {
  const base = path.basename(originalName).replace(/[^\w.\-]+/g, '_');
  if (!base || base === '.' || base === '..') {
    throw new CustomError('Invalid file name', 400);
  }
  return base;
}

function sanitizeSubFolder(subFolder?: string): string {
  if (!subFolder) return 'general';
  const cleaned = subFolder.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64);
  return cleaned || 'general';
}

/** Encode each path segment so `/` stays as path separators for MinIO path-style URLs. */
export function buildContentUrl(objectKey: string): string {
  const encoded = objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/content/${encoded}`;
}

/**
 * Upload a file to MinIO under a user folder and optional subfolder.
 */
export async function uploadFileHandler(
  payload: ServicePayload<CreateAssetRequest>
): Promise<ServiceResponse<AssetDTO>> {
  if (!featureFlags.isMinioAvailable) {
    throw new CustomError('File upload is currently unavailable', 503);
  }

  const file = payload.file;
  if (!file) throw new CustomError('No file uploaded', 400);

  const { originalname, buffer, mimetype } = file;
  if (!originalname || !buffer || !mimetype) {
    throw new CustomError('Invalid file payload', 400);
  }

  if (buffer.length > MAX_ASSET_SIZE_BYTES) {
    throw new CustomError('File exceeds maximum size of 5MB', 400);
  }

  if (!(ALLOWED_ASSET_MIME_TYPES as readonly string[]).includes(mimetype)) {
    throw new CustomError('Unsupported file type. Allowed: png, jpeg, gif, webp, svg', 400);
  }

  const userPrefix = payload.auth?.payload?.sub;
  if (!userPrefix) throw new CustomError('Authentication required', 401);

  const safeName = sanitizeFileName(originalname);
  const subFolder = sanitizeSubFolder(payload.body?.subFolder);
  const objectKey = `${userPrefix}/${subFolder}/${safeName}`;

  try {
    await minioClient.putObject(config!.minio.bucket!, objectKey, buffer, buffer.length, {
      'Content-Type': mimetype,
    });

    const url = buildContentUrl(objectKey);

    if (isSystemSubFolder(subFolder)) {
      return {
        message: 'File uploaded successfully',
        url,
      };
    }

    const asset = await executeInTransaction(async (t) => {
      const existing = await findByObjectKey(userPrefix, objectKey, t);
      if (existing) {
        // Overwrite: update mime/url metadata if needed; keep same assetId
        existing.fileType = mimetype;
        existing.url = url;
        existing.fileName = safeName;
        await existing.save({ transaction: t });
        return existing;
      }

      return await createAsset(
        {
          auth0Id: userPrefix,
          fileName: safeName,
          fileType: mimetype,
          objectKey,
          url,
        },
        t
      );
    }, 'uploadFileHandler');

    return {
      message: 'File uploaded successfully',
      asset: AssetMapper.toDTO(asset),
      url,
    };
  } catch (err) {
    if (err instanceof CustomError) throw err;
    if (isMinioConnectionError(err)) {
      latchMinioUnavailable(err);
      throw new CustomError('File upload is currently unavailable', 503);
    }
    logger.error('Failed to upload file to MinIO', err);
    throw new CustomError('File upload failed', 500);
  }
}

/**
 * Delete a file from MinIO and remove its DB row.
 * Identified by asset UUID owned by the authenticated user.
 */
export async function deleteFileHandler(
  payload: ServicePayload<unknown, { assetId: string }>
): Promise<ServiceResponse<null>> {
  if (!featureFlags.isMinioAvailable) {
    throw new CustomError('File delete is currently unavailable', 503);
  }

  const assetId = payload.params?.assetId;
  if (!assetId) throw new CustomError('Asset ID required', 400);

  const userPrefix = payload.auth?.payload?.sub;
  if (!userPrefix) throw new CustomError('Authentication required', 401);

  try {
    await executeInTransaction(async (t) => {
      const asset = await findByAssetId(assetId, t);
      if (!asset) {
        throw new CustomError('Asset not found', 404);
      }

      if (asset.auth0Id !== userPrefix) {
        throw new CustomError('Forbidden: cannot delete files of other users', 403);
      }

      if (!asset.objectKey.startsWith(`${userPrefix}/`)) {
        throw new CustomError('Forbidden: invalid object key ownership', 403);
      }

      await minioClient.removeObject(config!.minio.bucket!, asset.objectKey);
      await deleteAsset(asset.assetId, t);
    }, 'deleteFileHandler');

    return { message: 'File deleted successfully' };
  } catch (err) {
    if (err instanceof CustomError) throw err;
    if (isMinioConnectionError(err)) {
      latchMinioUnavailable(err);
      throw new CustomError('File delete is currently unavailable', 503);
    }
    logger.error('Failed to delete file from MinIO', err);
    throw new CustomError('File delete failed', 500);
  }
}

/**
 * List the authenticated user's assets.
 */
export async function listAssetsHandler(
  payload: ServicePayload<unknown, unknown, PaginationQuery>
): Promise<ServiceResponse<AssetDTO>> {
  if (!featureFlags.isMinioAvailable) {
    throw new CustomError('File listing is currently unavailable', 503);
  }

  const auth0Id = payload.auth?.payload?.sub;
  if (!auth0Id) throw new CustomError('Authentication required', 401);

  const { offset, limit } = PaginationService.getPaginationParams(payload.query || {});

  const { rows, count } = await findAssetsByUserId(auth0Id, offset, limit);
  const needles = rows.flatMap((asset) => [asset.url, asset.objectKey].filter(Boolean));
  const usage = await countAssetUsageByNeedle(auth0Id, needles);
  const assets = rows.map((asset) => {
    const dto = AssetMapper.toDTO(asset);
    const byUrl = asset.url ? (usage.get(asset.url) ?? 0) : 0;
    const byKey = asset.objectKey ? (usage.get(asset.objectKey) ?? 0) : 0;
    dto.usedInCount = Math.max(byUrl, byKey);
    return dto;
  });
  return {
    assets,
    totalCount: count,
  };
}

/**
 * Best-effort MinIO cleanup for all objects under the user's prefix.
 * Does not throw if MinIO is unavailable or individual deletes fail.
 */
export async function deleteUserMinioObjects(auth0Id: string): Promise<void> {
  if (!featureFlags.isMinioAvailable) {
    logger.warn(`MinIO unavailable — skipping object cleanup for user ${auth0Id}`);
    return;
  }

  const bucket = config!.minio.bucket!;
  const prefix = `${auth0Id}/`;
  let keys: string[] = [];
  try {
    keys = await listObjectKeys(bucket, prefix);
  } catch (err) {
    logger.error(`Failed to list MinIO objects for user ${auth0Id}`, err);
    if (isMinioConnectionError(err)) {
      latchMinioUnavailable(err);
    }
    return;
  }

  for (const objectKey of keys) {
    try {
      await minioClient.removeObject(bucket, objectKey);
    } catch (err) {
      logger.error(`Failed to remove MinIO object ${objectKey} for user ${auth0Id}`, err);
      if (isMinioConnectionError(err)) {
        latchMinioUnavailable(err);
        return;
      }
    }
  }
}

export async function removeSnippetSnapshot(auth0Id: string, snippetId: string): Promise<void> {
  if (!featureFlags.isMinioAvailable) {
    return;
  }
  const objectKey = snippetSnapshotObjectKey(auth0Id, snippetId);
  try {
    await minioClient.removeObject(config!.minio.bucket!, objectKey);
  } catch (err) {
    logger.error(`Failed to remove snippet snapshot ${objectKey}`, err);
    if (isMinioConnectionError(err)) {
      latchMinioUnavailable(err);
    }
  }
}

function listObjectKeys(bucket: string, prefix: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const keys: string[] = [];
    const stream = minioClient.listObjectsV2(bucket, prefix, true);
    stream.on('data', (obj) => {
      if (obj.name) keys.push(obj.name);
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(keys));
  });
}
