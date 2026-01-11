import express from 'express';
import { favorite, getFavoriteSnippets } from './favorite.controller';
import { publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const favoriteRouter = express.Router();

// Write operations - lower limit
favoriteRouter.get('/', publicReadLimiter,  getFavoriteSnippets);
favoriteRouter.post('/:snippetId', writeLimiter, favorite);

export default favoriteRouter;