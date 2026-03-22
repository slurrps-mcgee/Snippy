import { ServicePayload } from '../../common/interfaces/servicePayload.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { CustomError } from '../../common/exceptions/custom-error';
import logger from '../../common/utilities/logger';
import { minioClient } from '../../database/minio';
import { CreateResourceRequest } from './dto/resource.dto';
import { executeInTransaction } from '../../common/utilities/transaction';
import { createAsset, deleteAsset, findByFileName } from './resource.repo';
import { config, featureFlags } from '../../config';

/**
 * Upload a file to MinIO under a user folder and optional subfolder.
 * typeFolder: 'profiles' | 'snippets' etc
 */
export async function uploadFileHandler(
    payload: ServicePayload<CreateResourceRequest>
): Promise<ServiceResponse<{ url: string }>> {
    if(!featureFlags.isMinioAvailable) {
        throw new CustomError('File upload is currently unavailable', 503);
    }

    const { subFolder } = payload.body || {};
    const file = payload.file;

    if (!file) throw new CustomError('No file uploaded', 400);

    const { originalname, buffer, mimetype } = file;

    if (!originalname || !buffer || !mimetype) {
        throw new CustomError('Invalid file payload', 400);
    }

    const userPrefix = payload.auth?.payload?.sub;
    if (!userPrefix) throw new CustomError('Authentication required', 401);

    // Construct object path: userID[/subFolder]/filename
    const objectName = `${userPrefix}/${subFolder || 'general'}/${originalname}`;

    try {
        await minioClient.putObject(
            config!.minio.bucket!,
            objectName,
            buffer,
            buffer.length,
            { 'Content-Type': mimetype }
        );

        // URL-safe encoding
        const encodedName = encodeURIComponent(objectName);
        const url = `/content/${encodedName}`;

        // Try to insert, but don't fail if it already exists (file can be overwritten in MinIO)
        await executeInTransaction(async (t) => {
            try {
                await createAsset({
                    auth0Id: userPrefix,
                    fileName: originalname,
                    fileType: mimetype,
                    url
                }, t);
            } catch (err: any) {
                // Ignore unique constraint violations - file already exists in DB
                if (err.name !== 'SequelizeUniqueConstraintError') {
                    throw err;
                }
            }
        }, 'uploadFileHandler');

        return { message: 'File uploaded successfully', url };
    } catch (err) {
        logger.error('Failed to upload file to MinIO', err);
        throw new CustomError('File upload failed', 500);
    }
}

/**
 * Delete a file from MinIO.
 * Only allows deletion if file is in the authenticated user's folder
 */
export async function deleteFileHandler(
    payload: ServicePayload<unknown, { objectName: string }>
): Promise<ServiceResponse<null>> {
    if(!featureFlags.isMinioAvailable) {
        throw new CustomError('File delete is currently unavailable', 503);
    }

    let objectName = payload.params?.objectName;
    if (!objectName) throw new CustomError('Object name required', 400);

    // Strip /content/ prefix if present
    if (objectName.startsWith('content/')) {
        objectName = objectName.substring('content/'.length);
    }

    const decodedName = decodeURIComponent(objectName);

    const userPrefix = payload.auth?.payload?.sub;
    if (!userPrefix) throw new CustomError('Authentication required', 401);

    const originalName = decodedName.split('/').slice(-1)[0];

    console.log(originalName);

    // Only allow deletion if the object is in the authenticated user's folder
    const allowedPrefixes = [`${userPrefix}/`, `profiles/${userPrefix}/`];
    if (!allowedPrefixes.some(prefix => decodedName.startsWith(prefix))) {
        throw new CustomError('Unauthorized: cannot delete files of other users', 403);
    }

    try {
        await minioClient.removeObject(config!.minio.bucket!, decodedName);

        await executeInTransaction(async (t) => {
            const asset = await findByFileName(originalName, t);
            if (asset) {
                await deleteAsset(asset.assetId, t);
            }
        }, 'deleteFileHandler');

        return { message: 'File deleted successfully' };
    } catch (err) {
        logger.error('Failed to delete file from MinIO', err);
        throw new CustomError('File delete failed', 500);
    }
}