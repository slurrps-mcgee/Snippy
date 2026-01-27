import express from 'express';
import userRouter from '../modules/user/user.routes';
import snippetRouter from '../modules/snippet/snippet.routes';
import commentRouter from '../modules/comment/comment.routes';
import favoriteRouter from '../modules/favorite/favorite.routes';
import resourceRouter from '../modules/resource/resource.routes';

const router = express.Router();

// Define routes for user operations
router.use('/users', userRouter);
router.use('/snippets', snippetRouter);
router.use('/comments', commentRouter);
router.use('/favorites', favoriteRouter);

//Minio resource routes disabled for now
//router.use('/resources', resourceRouter);

export default router;