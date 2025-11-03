import { NextFunction, Request, Response } from 'express';
import { 
    createSnippetHandler, 
    deleteSnippetHandler, 
    forkSnippetHandler, 
    getAllPublicSnippetsHandler, 
    getUserPublicSnippetsHandler, 
    getMySnippetsHandler, 
    getSnippetHandler, 
    updateSnippetHandler, 
    updateSnippetViewCountHandler, 
    searchSnippetsHandler
} from "./snippet.service";
import { validateCreateSnippet, validateForkSnippet, validateUpdateSnippet } from './snippet.validator';

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
    try {
        await deleteSnippetHandler(req);
        res.status(204).json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function forkSnippet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await validateForkSnippet(req.body);

        const { snippet } = await forkSnippetHandler(req);
        res.status(201).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for getting all public snippets
 * Calls service and sends response
 * Returns array of public snippets
 */
export async function getPublicSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets } = await getAllPublicSnippetsHandler(req);
        res.status(200).json({ success: true, snippets });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for getting current user's snippets
 * Calls service and sends response
 * Returns array of user's own snippets
 */
export async function getCurrentUserSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets } = await getMySnippetsHandler(req);
        res.status(200).json({ success: true, snippets });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for searching snippets by query
 * Calls service and sends response
 * Returns array of snippets matching search criteria
 */
export async function searchSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets } = await searchSnippetsHandler(req);
        res.status(200).json({ success: true, snippets });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for getting a specific snippet by its short ID
 * Calls service and sends response
 * Returns single snippet with all details and ownership status
 */
export async function getSnippetByShortId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet, isOwner } = await getSnippetHandler(req);
        res.status(200).json({ success: true, snippet, isOwner });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for getting a user's public snippets
 * Calls service and sends response
 * Returns array of public snippets by specified user
 */
export async function getUserPublicSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippets } = await getUserPublicSnippetsHandler(req);
        res.status(200).json({ success: true, snippets });
    } catch (error) {
        next(error);
    }
}
    

/**
 * Controller for updating snippet view count
 * Calls service and sends response
 * Returns updated snippet with incremented view count
 */
export async function updateSnippetViewCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { snippet } = await updateSnippetViewCountHandler(req);
        res.status(200).json({ success: true, snippet });
    } catch (error) {
        next(error);
    }
}