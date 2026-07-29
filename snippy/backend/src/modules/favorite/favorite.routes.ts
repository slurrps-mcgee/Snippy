import express from 'express';
import { favorite, getFavoriteSnippets, isFavorite } from './favorite.controller';
import { publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const favoriteRouter = express.Router();

favoriteRouter.get('/', publicReadLimiter, getFavoriteSnippets);
favoriteRouter.get('/:snippetId', publicReadLimiter, isFavorite);
favoriteRouter.post('/:snippetId', writeLimiter, favorite);

export default favoriteRouter;
