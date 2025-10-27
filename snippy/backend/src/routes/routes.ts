import express from 'express';
import userRouter from '../modules/user/user.routes';
import snippetRouter from '../modules/snippet/snippet.routes';

const router = express.Router();

// Define routes for user operations
router.use('/users', userRouter);
router.use('/snippets', snippetRouter);

export default router;