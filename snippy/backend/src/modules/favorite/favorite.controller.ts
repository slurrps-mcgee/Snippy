import { NextFunction, Request, Response } from 'express';
import { validateCreateOrDeleteFavorite } from './favorite.validator';
import {
  favoriteHandler,
  getFavoriteSnippetsByUserHandler,
  isFavoriteHandler,
} from './favorite.service';

/**
 * @swagger
 * /favorites/{snippetId}:
 *   post:
 *     summary: Add or remove a snippet from user's favorites
 *     tags:
 *       - Favorites
 *     parameters:
 *       - in: path
 *         name: snippetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Favorite toggled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Snippet not found
 */
export async function favorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    validateCreateOrDeleteFavorite(req.params);
    const { favoriteCount, isFavorited } = await favoriteHandler(req);
    res.status(200).json({ success: true, isFavorited, favoriteCount });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /favorites/{snippetId}:
 *   get:
 *     summary: Check if a snippet is favorited by the current user
 *     tags:
 *       - Favorites
 *     parameters:
 *       - in: path
 *         name: snippetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Favorite status
 */
export async function isFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    validateCreateOrDeleteFavorite(req.params);
    const { isFavorited } = await isFavoriteHandler(req);
    res.status(200).json({ success: true, isFavorited });
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
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional free-text filter over the favorited snippet's name, description, and tags
 *     responses:
 *       200:
 *         description: List of favorited snippets
 *       401:
 *         description: Authentication required
 */
export async function getFavoriteSnippets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { snippets, totalCount } = await getFavoriteSnippetsByUserHandler(req);
    res.status(200).json({ success: true, snippets, totalCount });
  } catch (error) {
    next(error);
  }
}
