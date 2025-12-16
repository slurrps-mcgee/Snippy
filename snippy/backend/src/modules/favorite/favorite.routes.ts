import express from 'express';
import { addFavorite, deleteFavorite } from './favorite.controller';
import { writeLimiter } from '../../common/middleware/rate-limit.service';

const favoriteRouter = express.Router();

// Write operations - lower limit
favoriteRouter.post('/', writeLimiter, addFavorite);
favoriteRouter.delete('/:favoriteId', writeLimiter, deleteFavorite);

export default favoriteRouter;