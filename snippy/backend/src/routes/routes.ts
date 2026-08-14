import express from 'express';
import userRouter from '../modules/user/user.routes';
import snippetRouter from '../modules/snippet/snippet.routes';
import commentRouter from '../modules/comment/comment.routes';
import favoriteRouter from '../modules/favorite/favorite.routes';
import assetRouter from '../modules/asset/asset.routes';
import collectionRouter from '../modules/collection/collection.routes';

const router = express.Router();

router.use('/users', userRouter);
router.use('/snippets', snippetRouter);
router.use('/comments', commentRouter);
router.use('/favorites', favoriteRouter);
router.use('/collections', collectionRouter);
router.use('/assets', assetRouter);

export default router;
