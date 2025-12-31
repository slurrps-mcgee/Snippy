
import { NextFunction, Request, Response } from 'express';
import { validateCreateOrDeleteFavorite } from './favorite.validator';
import { addFavoriteHandler, getFavoriteSnippetsByUserHandler, removeFavoriteHandler } from './favorite.service';



/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Add a snippet to user's favorites
 *     tags:
 *       - Favorites
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               snippetId:
 *                 type: string
 *                 description: The ID of the snippet to favorite
 *     responses:
 *       201:
 *         description: Favorite added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Snippet not found
 */
export async function addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateCreateOrDeleteFavorite(req.body);
        const { message } = await addFavoriteHandler(req);
        res.status(201).json({ success: true, message });
    } catch (error) {
        next(error);
    }
}


/**
 * @swagger
 * /favorites:
 *   delete:
 *     summary: Remove a snippet from user's favorites
 *     tags:
 *       - Favorites
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               snippetId:
 *                 type: string
 *                 description: The ID of the snippet to remove from favorites
 *     responses:
 *       200:
 *         description: Favorite removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 */
export async function deleteFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateCreateOrDeleteFavorite(req.body);
        const { message } = await removeFavoriteHandler(req);
        res.status(200).json({ success: true, message });
    } catch (error) {
        next(error);
    }
}


/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Get a list of snippets favorited by the user
 *     tags:
 *       - Favorites
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Pagination offset
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Pagination limit
 *     responses:
 *       200:
 *         description: List of favorited snippets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 snippets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SnippetListDTO'
 *                 totalCount:
 *                   type: integer
 *       401:
 *         description: Authentication required
 */
export async function getFavoriteSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets, totalCount } = await getFavoriteSnippetsByUserHandler(req);
        res.status(200).json({ success: true, snippets, totalCount });
    } catch (error) {
        next(error);
    }
}