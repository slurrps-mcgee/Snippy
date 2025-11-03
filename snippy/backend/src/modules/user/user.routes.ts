import express from 'express';
import { getUserProfile, checkUsername, ensureUser, updateUser, getCurrentUserProfile, deleteUser } from './user.controller';

const userRouter = express.Router();

userRouter.get('/check-username/:userName', checkUsername); // More specific route first
userRouter.get('/me', getCurrentUserProfile);
userRouter.get('/:userName', getUserProfile);
userRouter.post('/', ensureUser);
userRouter.put('/', updateUser);
userRouter.delete('/', deleteUser);

export default userRouter;