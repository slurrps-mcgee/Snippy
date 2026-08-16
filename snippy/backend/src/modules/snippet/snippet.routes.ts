import express from 'express';
import { 
    createSnippet, 
    deleteSnippet, 
    forkSnippet,
    getCurrentUserSnippets,
    getPublicSnippets,
    getSnippetByShortId,
    getUserPublicSnippets,
    searchSnippets,
    updateSnippet, 
    updateSnippetViewCount,
    getFeedSnippets,
    getSnippetEmbed,
    uploadSnippetSnapshot,
    getSnippetByShareToken,
    createSnippetShareLink,
    revokeSnippetShareLink,
} from './snippet.controller';
import { publicReadLimiter, searchLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';


const snippetRouter = express.Router();

// Search operations - moderate limit to prevent abuse
snippetRouter.get('/search', searchLimiter, searchSnippets);

// Public read operations - higher limit
snippetRouter.get('/public', publicReadLimiter, getPublicSnippets);  
snippetRouter.get('/feed', publicReadLimiter, getFeedSnippets);
snippetRouter.get('/me', publicReadLimiter, getCurrentUserSnippets);
snippetRouter.get('/user/:userName', publicReadLimiter, getUserPublicSnippets);
snippetRouter.get('/shared/:token', publicReadLimiter, getSnippetByShareToken);
snippetRouter.get('/:shortId/embed', publicReadLimiter, getSnippetEmbed);
snippetRouter.get('/:shortId', publicReadLimiter, getSnippetByShortId);

// Write operations - lower limit
snippetRouter.post('/', writeLimiter, createSnippet);
snippetRouter.post('/fork/:snippetId', writeLimiter, forkSnippet);
snippetRouter.post('/:snippetId/snapshot', writeLimiter, uploadSnippetSnapshot);
snippetRouter.post('/:snippetId/share', writeLimiter, createSnippetShareLink);
snippetRouter.delete('/:snippetId/share', writeLimiter, revokeSnippetShareLink);
snippetRouter.put('/:snippetId', writeLimiter, updateSnippet);
snippetRouter.post('/:snippetId/view', writeLimiter, updateSnippetViewCount);
snippetRouter.delete('/:snippetId', writeLimiter, deleteSnippet);

export default snippetRouter;
