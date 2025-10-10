import express from 'express';
import inviteRouter from '../modules/invite/invite.routes';
import userRouter from '../modules/user/user.routes';

const router = express.Router();

// Define routes for user operations
router.use('/invite', inviteRouter);
router.use('/users', userRouter);

export default router;