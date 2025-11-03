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


const snippetRouter = express.Router();

snippetRouter.get('/search', searchSnippets);
snippetRouter.get('/public', getPublicSnippets);  
snippetRouter.get('/me', getCurrentUserSnippets);
snippetRouter.get('/user/:userName', getUserPublicSnippets);
snippetRouter.get('/:shortId', getSnippetByShortId);
// snippetRouter.get('/:shortId/forks', getSnippetForks);
snippetRouter.post('/', createSnippet);
snippetRouter.post('/fork', forkSnippet);
snippetRouter.put('/:shortId', updateSnippet);
snippetRouter.post('/:shortId/view', updateSnippetViewCount);
snippetRouter.delete('/:shortId', deleteSnippet);

export default snippetRouter;