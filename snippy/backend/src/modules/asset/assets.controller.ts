import { Request, Response, NextFunction } from 'express';
import { uploadFileHandler, deleteFileHandler, listAssetsHandler } from './asset.service';
import multer from 'multer';
import { ALLOWED_ASSET_MIME_TYPES, MAX_ASSET_SIZE_BYTES } from './dto/asset.dto';
import { CustomError } from '../../common/exceptions/custom-error';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ASSET_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_ASSET_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new CustomError('Unsupported file type. Allowed: png, jpeg, gif, webp, svg', 400));
    }
  },
});

/**
 * @swagger
 * /assets:
 *   get:
 *     tags: [Asset]
 *     summary: List current user's uploaded assets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset list
 *       503:
 *         description: MinIO unavailable
 */
export async function listAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { assets, totalCount } = await listAssetsHandler(req);
    res.status(200).json({ success: true, assets, totalCount });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /assets:
 *   post:
 *     tags: [Asset]
 *     summary: Upload a file asset
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               subFolder:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded
 */
export const uploadFile = [
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, url, asset } = await uploadFileHandler(req);
      res.status(201).json({ success: true, message, url, asset });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * @swagger
 * /assets/{assetId}:
 *   delete:
 *     tags: [Asset]
 *     summary: Delete a file asset by asset ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: File deleted
 */
export async function deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteFileHandler(req);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
