import express from 'express';
import userRouter from '../modules/user/user.routes';
import snippetRouter from '../modules/snippet/snippet.routes';
import commentRouter from '../modules/comment/comment.routes';
import favoriteRouter from '../modules/favorite/favorite.routes';

const router = express.Router();

// Define routes for user operations
router.use('/users', userRouter);
router.use('/snippets', snippetRouter);
router.use('/comments', commentRouter);
router.use('/favorites', favoriteRouter);

export default router;