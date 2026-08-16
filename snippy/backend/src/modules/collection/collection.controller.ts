import { NextFunction, Request, Response } from 'express';
import {
    createCollectionHandler,
    updateCollectionHandler,
    deleteCollectionHandler,
    getMyCollectionsHandler,
    getUserCollectionsHandler,
    getCollectionByShortIdHandler,
    addSnippetToCollectionHandler,
    removeSnippetFromCollectionHandler,
    reorderCollectionSnippetsHandler,
} from './collection.service';
import {
    validateCreateCollection,
    validateUpdateCollection,
    validateAddCollectionSnippet,
    validateReorderCollectionSnippets,
} from './collection.validator';

export async function createCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateCreateCollection(req.body);
        const { collection } = await createCollectionHandler(req);
        res.status(201).json({ success: true, collection });
    } catch (error) {
        next(error);
    }
}

export async function updateCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateUpdateCollection(req.body);
        const { collection } = await updateCollectionHandler(req);
        res.status(200).json({ success: true, collection });
    } catch (error) {
        next(error);
    }
}

export async function deleteCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await deleteCollectionHandler(req);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export async function getMyCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { collections, totalCount } = await getMyCollectionsHandler(req);
        res.status(200).json({ success: true, collections, totalCount });
    } catch (error) {
        next(error);
    }
}

export async function getUserCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { collections, totalCount } = await getUserCollectionsHandler(req);
        res.status(200).json({ success: true, collections, totalCount });
    } catch (error) {
        next(error);
    }
}

export async function getCollectionByShortId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { collection } = await getCollectionByShortIdHandler(req);
        res.status(200).json({ success: true, collection });
    } catch (error) {
        next(error);
    }
}

export async function addSnippetToCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateAddCollectionSnippet(req.body);
        const { collection } = await addSnippetToCollectionHandler(req);
        res.status(200).json({ success: true, collection });
    } catch (error) {
        next(error);
    }
}

export async function removeSnippetFromCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await removeSnippetFromCollectionHandler(req);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export async function reorderCollectionSnippets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateReorderCollectionSnippets(req.body);
        const { message } = await reorderCollectionSnippetsHandler(req);
        res.status(200).json({ success: true, message });
    } catch (error) {
        next(error);
    }
}
