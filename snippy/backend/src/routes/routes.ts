import express from 'express';
import userRouter from '../modules/user/user.routes';

const router = express.Router();

// Define routes for user operations
router.use('/users', userRouter);

export default router;