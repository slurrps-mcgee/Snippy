import { NextFunction, Request, Response } from 'express';
import {
    createSnippetHandler,
    deleteSnippetHandler,
    forkSnippetHandler,
    getAllPublicSnippetsHandler,
    getUserPublicSnippetsHandler,
    getMySnippetsHandler,
    getSnippetByShortIdHandler,
    updateSnippetHandler,
    updateSnippetViewCountHandler,
    searchSnippetsHandler,
    getFeedSnippetsHandler,
    getSnippetEmbedHtmlHandler,
    uploadSnippetSnapshotHandler,
    getSnippetByShareTokenHandler,
    createSnippetShareLinkHandler,
    revokeSnippetShareLinkHandler,
} from "./snippet.service";
import { validateCreateSnippet, validateUpdateSnippet } from './snippet.validator';
import multer from 'multer';
import { ALLOWED_ASSET_MIME_TYPES, MAX_ASSET_SIZE_BYTES } from '../asset/dto/asset.dto';
import { CustomError } from '../../common/exceptions/custom-error';

/**
 * @swagger
 * /snippets:
 *   post:
 *     tags:
 *       - Snippet
 *     summary: Create a new snippet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               snippetFiles:
 *                 type: array
 *     responses:
 *       '201':
 *         description: Created snippet
 *       '400':
 *         description: Validation error
 */
export async function createSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateCreateSnippet(req.body);

        const { snippet } = await createSnippetHandler(req);
        res.status(201).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/{shortId}:
 *   put:
 *     tags:
 *       - Snippet
 *     summary: Update a snippet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shortId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               tags:
 *                 type: array
 *     responses:
 *       '200':
 *         description: Updated snippet
 *       '404':
 *         description: Not found
 */
export async function updateSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateUpdateSnippet(req.body);

        const { snippet } = await updateSnippetHandler(req);
        res.status(200).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/{shortId}:
 *   delete:
 *     tags:
 *       - Snippet
 *     summary: Delete a snippet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shortId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Snippet Deleted
 *       '404':
 *         description: Not found
 */
export async function deleteSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await deleteSnippetHandler(req);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

const snapshotUpload = multer({
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
 * /snippets/{snippetId}/snapshot:
 *   post:
 *     tags:
 *       - Snippet
 *     summary: Upload a preview snapshot for a snippet (MinIO)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: snippetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       '200':
 *         description: Snapshot stored
 *       '503':
 *         description: MinIO unavailable
 */
export const uploadSnippetSnapshot = [
  snapshotUpload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { snippet } = await uploadSnippetSnapshotHandler(req);
      res.status(200).json({ success: true, snippet });
    } catch (error) {
      next(error);
    }
  },
];


/**
 * @swagger
 * /snippets/fork:
 *   post:
 *     tags:
 *       - Snippet
 *     summary: Fork an existing snippet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shortId:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Forked snippet
 *       '404':
 *         description: Not found
 */
export async function forkSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet } = await forkSnippetHandler(req);
        res.status(201).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/public:
 *   get:
 *     tags:
 *       - Snippet
 *     summary: Get public snippets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional free-text filter over name, description, and tags
 *     responses:
 *       '200':
 *         description: Public snippets list
 */
export async function getPublicSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets, totalCount } = await getAllPublicSnippetsHandler(req);
        res.status(200).json({ success: true, snippets, totalCount });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/me:
 *   get:
 *     tags:
 *       - Snippet
 *     summary: Get snippets for the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional free-text filter over name, description, and tags
 *     responses:
 *       '200':
 *         description: User's snippets
 */
export async function getCurrentUserSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets, totalCount } = await getMySnippetsHandler(req);
        res.status(200).json({ success: true, snippets, totalCount });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/search:
 *   get:
 *     tags:
 *       - Snippet
 *     summary: Search snippets by query
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       '200':
 *         description: Search results
 */
export async function searchSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets, totalCount } = await searchSnippetsHandler(req);
        res.status(200).json({ success: true, snippets, totalCount });
    } catch (error) {
        next(error);
    }
}

export async function getFeedSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets, totalCount } = await getFeedSnippetsHandler(req);
        res.status(200).json({ success: true, snippets, totalCount });
    } catch (error) {
        next(error);
    }
}

export async function getSnippetEmbed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const html = await getSnippetEmbedHtmlHandler(req);
        res.removeHeader('X-Frame-Options');
        res.setHeader('Content-Security-Policy', "frame-ancestors *");
        res.type('html').status(200).send(html);
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/{shortId}:
 *   get:
 *     tags:
 *       - Snippet
 *     summary: Get a snippet by shortId
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shortId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Snippet object
 *       '404':
 *         description: Not found
 */
export async function getSnippetByShortId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet } = await getSnippetByShortIdHandler(req);
        res.status(200).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/user/{userName}:
 *   get:
 *     tags:
 *       - Snippet
 *     summary: Get public snippets for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional free-text filter over name, description, and tags
 *     responses:
 *       '200':
 *         description: User public snippets
 *       '404':
 *         description: Not found
 */
export async function getUserPublicSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets, totalCount } = await getUserPublicSnippetsHandler(req);
        res.status(200).json({ success: true, snippets, totalCount });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/{snippetId}/view:
 *   post:
 *     tags:
 *       - Snippet
 *     summary: Record a unique view for a snippet (owner skipped; 24h cooldown per viewer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: snippetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Current view count; counted indicates whether this request incremented it
 */
export async function updateSnippetViewCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { viewCount, counted } = await updateSnippetViewCountHandler(req);
        res.status(200).json({ success: true, viewCount, counted });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/shared/{token}:
 *   get:
 *     tags: [Snippet]
 *     summary: Load a snippet by private share token (no JWT required)
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Snippet
 *       '404':
 *         description: Unknown token
 */
export async function getSnippetByShareToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet } = await getSnippetByShareTokenHandler(req);
        res.status(200).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/{snippetId}/share:
 *   post:
 *     tags: [Snippet]
 *     summary: Create or return a secret share token for a private (or public) pen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Share token
 */
export async function createSnippetShareLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { shareToken } = await createSnippetShareLinkHandler(req);
        res.status(200).json({ success: true, shareToken });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /snippets/{snippetId}/share:
 *   delete:
 *     tags: [Snippet]
 *     summary: Revoke the secret share token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '204':
 *         description: Revoked
 */
export async function revokeSnippetShareLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await revokeSnippetShareLinkHandler(req);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}