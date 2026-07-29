import express from 'express';
import {
    createCollection,
    updateCollection,
    deleteCollection,
    getMyCollections,
    getUserCollections,
    getCollectionByShortId,
    addSnippetToCollection,
    removeSnippetFromCollection,
    reorderCollectionSnippets,
} from './collection.controller';
import { publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const collectionRouter = express.Router();

collectionRouter.get('/me', publicReadLimiter, getMyCollections);
collectionRouter.get('/user/:userName', publicReadLimiter, getUserCollections);
collectionRouter.get('/:shortId', publicReadLimiter, getCollectionByShortId);

collectionRouter.post('/', writeLimiter, createCollection);
collectionRouter.put('/:collectionId', writeLimiter, updateCollection);
collectionRouter.delete('/:collectionId', writeLimiter, deleteCollection);

collectionRouter.post('/:collectionId/snippets', writeLimiter, addSnippetToCollection);
collectionRouter.delete('/:collectionId/snippets/:snippetId', writeLimiter, removeSnippetFromCollection);
collectionRouter.put('/:collectionId/snippets/order', writeLimiter, reorderCollectionSnippets);

export default collectionRouter;
