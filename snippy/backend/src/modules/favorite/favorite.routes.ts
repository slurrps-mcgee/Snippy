import express from 'express';
import { addFavorite, deleteFavorite } from './favorite.controller';

const favoriteRouter = express.Router();
favoriteRouter.post('/', addFavorite);
favoriteRouter.delete('/:favoriteId', deleteFavorite);

export default favoriteRouter;