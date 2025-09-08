import express from 'express';
import inviteRouter from '../modules/invite/invite.routes';

const router = express.Router();

// Define routes for user operations
router.use('/invite', inviteRouter);

// router.post('/users/createuser', createUser);
// router.post('users/getuserbyemail', getUserByEmail);

export default router;