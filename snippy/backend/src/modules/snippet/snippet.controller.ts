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
    searchSnippetsHandler
} from "./snippet.service";
import { validateCreateSnippet, validateForkSnippet, validateUpdateSnippet } from './snippet.validator';

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
        validateForkSnippet(req.body);

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
 * /snippets/{shortId}/view:
 *   post:
 *     tags:
 *       - Snippet
 *     summary: Increment view count for a snippet
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
 *         description: View count updated
 */
export async function updateSnippetViewCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet } = await updateSnippetViewCountHandler(req);
        res.status(200).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}