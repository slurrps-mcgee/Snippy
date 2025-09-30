import express from 'express';
import inviteRouter from '../modules/invite/invite.routes';
import authRouter from '../modules/auth/auth.routes';

const router = express.Router();

// Define routes for user operations
router.use('/invite', inviteRouter);
router.use('/auth', authRouter);

// router.post('/users/createuser', createUser);
// router.post('users/getuserbyemail', getUserByEmail);

export default router;