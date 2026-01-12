import { ServicePayload } from '../../common/interfaces/servicePayload.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { CustomError } from '../../common/exceptions/custom-error';
import logger from '../../common/utilities/logger';
import { minioClient } from '../../database/minio';
import multer from 'multer';
import { CreateResourceRequest } from './dto/resource.dto';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Upload a file to MinIO under a user folder and optional subfolder.
 * typeFolder: 'profiles' | 'snippets' etc
 */
export async function uploadFileHandler(
    payload: ServicePayload<CreateResourceRequest>
): Promise<ServiceResponse<{ url: string }>> {
    const { subFolder } = payload.body || {};
    const file = payload.file;

    if (!file) throw new CustomError('No file uploaded', 400);

    const { originalname, buffer, mimetype } = file;

    if (!originalname || !buffer || !mimetype) {
        throw new CustomError('Invalid file payload', 400);
    }

    const userPrefix = payload.auth?.payload?.sub;
    if (!userPrefix) throw new CustomError('Authentication required', 401);

    // Construct object path: userID[/subFolder]/timestamp-filename
    const objectName = `${userPrefix}/${subFolder || 'general'}/${Date.now()}-${originalname}`;

    try {
        await minioClient.putObject(
            process.env.MINIO_BUCKET!,
            objectName,
            buffer,
            buffer.length,
            { 'Content-Type': mimetype }
        );

        // URL-safe encoding
        const encodedName = encodeURIComponent(objectName);
        const url = `/uploads/${encodedName}`;

        return { url };
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
    const encodedName = payload.params?.objectName;
    if (!encodedName) throw new CustomError('Object name required', 400);

    const objectName = decodeURIComponent(encodedName);

    const userPrefix = payload.auth?.payload?.sub;
    if (!userPrefix) throw new CustomError('Authentication required', 401);

    // Only allow deletion if the object is in the authenticated user's folder
    const allowedPrefixes = [`${userPrefix}/`, `profiles/${userPrefix}/`];
    if (!allowedPrefixes.some(prefix => objectName.startsWith(prefix))) {
        throw new CustomError('Unauthorized: cannot delete files of other users', 403);
    }

    try {
        await minioClient.removeObject(process.env.MINIO_BUCKET!, objectName);
        return { message: 'File deleted successfully' };
    } catch (err) {
        logger.error('Failed to delete file from MinIO', err);
        throw new CustomError('File delete failed', 500);
    }
}
