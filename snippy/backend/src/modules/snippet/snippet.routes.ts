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
    updateSnippetViewCount
} from './snippet.controller';
import { publicReadLimiter, searchLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';


const snippetRouter = express.Router();

// Search operations - moderate limit to prevent abuse
snippetRouter.get('/search', searchLimiter, searchSnippets);

// Public read operations - higher limit
snippetRouter.get('/public', publicReadLimiter, getPublicSnippets);  
snippetRouter.get('/me', publicReadLimiter, getCurrentUserSnippets);
snippetRouter.get('/user/:userName', publicReadLimiter, getUserPublicSnippets);
snippetRouter.get('/:shortId', publicReadLimiter, getSnippetByShortId);

// Write operations - lower limit
snippetRouter.post('/', writeLimiter, createSnippet);
snippetRouter.post('/fork', writeLimiter, forkSnippet);
snippetRouter.put('/:shortId', writeLimiter, updateSnippet);
snippetRouter.post('/:shortId/view', writeLimiter, updateSnippetViewCount);
snippetRouter.delete('/:shortId', writeLimiter, deleteSnippet);

export default snippetRouter;