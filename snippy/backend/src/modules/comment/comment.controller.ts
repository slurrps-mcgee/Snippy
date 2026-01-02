
import { NextFunction, Request, Response } from 'express';
import { addCommentHandler, updateCommentHandler, getCommentsBySnippetIdHandler, deleteCommentHandler } from './comment.service';
import { validateCreateComment, validateUpdateComment } from './comment.validator';


/**
 * @swagger
 * comments:
 *   get:
 *     summary: Get comments for a snippet
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: query
 *         name: snippetId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the snippet to get comments for
 *     responses:
 *       200:
 *         description: List of comments for the snippet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommentDTO'
 *       404:
 *         description: Snippet not found
 */
export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { comments, totalCount } = await getCommentsBySnippetIdHandler(req);
        res.status(200).json({ success: true, comments, count: totalCount });
    } catch (error) {
        next(error);
    }
}


/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment for a snippet
 *     tags:
 *       - Comments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               snippetId:
 *                 type: string
 *                 description: The ID of the snippet to comment on
 *               content:
 *                 type: string
 *                 description: The comment content
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comment:
 *                   $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Snippet not found
 */
export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateCreateComment(req.body);
        const { comment } = await addCommentHandler(req);
        res.status(201).json({ success: true, comment });
    } catch (error) {
        next(error);
    }
}


/**
 * @swagger
 * /comments:
 *   put:
 *     summary: Update an existing comment
 *     tags:
 *       - Comments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentId:
 *                 type: string
 *                 description: The ID of the comment to update
 *               content:
 *                 type: string
 *                 description: The updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comment:
 *                   $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Comment not found
 */
export async function updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateUpdateComment(req.body);
        const { comment } = await updateCommentHandler(req);
        res.status(200).json({ success: true, comment });

    } catch (error) {
        next(error);
    }
}


/**
 * @swagger
 * /comments:
 *   delete:
 *     summary: Delete a comment
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: query
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment to delete
 *     responses:
 *       204:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Comment not found
 */
export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { message } = await deleteCommentHandler(req);
        res.status(204).json({ success: true, message });
    } catch (error) {
        next(error);
    }
}