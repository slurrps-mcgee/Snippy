import express from 'express';
import { addFavorite, deleteFavorite, getFavoriteSnippets } from './favorite.controller';
import { publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const favoriteRouter = express.Router();

// Write operations - lower limit
favoriteRouter.get('/', publicReadLimiter,  getFavoriteSnippets);
favoriteRouter.post('/:shortId', writeLimiter, addFavorite);
favoriteRouter.delete('/:shortId', writeLimiter, deleteFavorite);

export default favoriteRouter;