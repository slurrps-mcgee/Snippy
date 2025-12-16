import { NextFunction, Request, Response } from 'express';
import { addCommentHandler, updateCommentHandler, getCommentsBySnippetIdHandler, deleteCommentHandler } from './comment.service';
import { validateCreateComment, validateUpdateComment } from './comment.validator';

export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { comments } = await getCommentsBySnippetIdHandler(req);
        res.status(200).json({ success: true, comments });
    } catch (error) {
        next(error);
    }
}

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateCreateComment(req.body);
        const { comment } = await addCommentHandler(req);
        res.status(201).json({ success: true, comment });
    } catch (error) {
        next(error);
    }
}

export async function updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateUpdateComment(req.body);
        const { comment } = await updateCommentHandler(req);
        res.status(200).json({ success: true, comment });
        
    } catch (error) {
        next(error);
    }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { message } = await deleteCommentHandler(req);
        res.status(204).json({ success: true, message });
    } catch (error) {
        next(error);
    }
}