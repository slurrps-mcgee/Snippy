import express from 'express';
import { register, updateUser } from './user.controller';

const userRouter = express.Router();

userRouter.post('/', register);
userRouter.put('/', updateUser);

export default userRouter;