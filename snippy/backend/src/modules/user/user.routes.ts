import express from 'express';
import { checkUsername, ensureUser, updateUser } from './user.controller';

const userRouter = express.Router();

userRouter.post('/', ensureUser);
userRouter.put('/', updateUser);
userRouter.get('/check-username/:username', checkUsername);

export default userRouter;