import { NextFunction, Request, Response } from 'express';
import { createSnippetHandler, deleteSnippetHandler, forkSnippetHandler, getAllPublicSnippetsHandler, getAllUserSnippetsHandler, getSnippetHandler, updateSnippetHandler } from "./snippet.service";
import { validateCreateSnippet, validateUpdateSnippet } from './snippet.validator';

export async function createSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await validateCreateSnippet(req.body);
        
        const { snippet } = await createSnippetHandler(req);
        res.status(201).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

export async function updateSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await validateUpdateSnippet(req.body);
        
        const { snippet } = await updateSnippetHandler(req);
        res.status(200).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

export async function deleteSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Implementation for deleting a snippet
    try {
        await deleteSnippetHandler(req);
        res.status(204).json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function forkSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet } = await forkSnippetHandler(req);
        res.status(201).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

export async function getAllPublicSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets } = await getAllPublicSnippetsHandler(req);
        res.status(200).json({ success: true, snippets });
    } catch (error) {
        next(error);
    }
}

export async function getAllUserSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets } = await getAllUserSnippetsHandler(req);
        res.status(200).json({ success: true, snippets });
    } catch (error) {
        next(error);
    }
}

export async function getSnippetByShortId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet } = await getSnippetHandler(req);
        res.status(200).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}
    