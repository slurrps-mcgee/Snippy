import express from 'express';
import { createComment, deleteComment, getComments, updateComment } from './comment.controller';

const commentRouter = express.Router();
commentRouter.get('/:shortId', getComments);
commentRouter.post('/:shortId', createComment);
commentRouter.put('/:commentId', updateComment);
commentRouter.delete('/:commentId', deleteComment);

export default commentRouter;