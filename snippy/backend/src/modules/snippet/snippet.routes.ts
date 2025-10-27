import express from 'express';
import { createSnippet, deleteSnippet, getAllPublicSnippets, getSnippetByShortId, updateSnippet, forkSnippet, getAllUserSnippets } from './snippet.controller';


const snippetRouter = express.Router();

snippetRouter.get('/', getAllUserSnippets);
snippetRouter.get('/public', getAllPublicSnippets);
snippetRouter.get('/:shortId', getSnippetByShortId);
snippetRouter.post('/', createSnippet);
snippetRouter.post('/fork', forkSnippet);
snippetRouter.put('/', updateSnippet);
snippetRouter.delete('/:shortId', deleteSnippet);

export default snippetRouter;