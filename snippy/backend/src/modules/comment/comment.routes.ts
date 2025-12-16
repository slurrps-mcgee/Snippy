import express from 'express';
import { createComment, deleteComment, getComments, updateComment } from './comment.controller';
import { publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const commentRouter = express.Router();

// Public read operations - higher limit
commentRouter.get('/:shortId', publicReadLimiter, getComments);

// Write operations - lower limit
commentRouter.post('/:shortId', writeLimiter, createComment);
commentRouter.put('/:commentId', writeLimiter, updateComment);
commentRouter.delete('/:commentId', writeLimiter, deleteComment);

export default commentRouter;