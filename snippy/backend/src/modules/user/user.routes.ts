import express from 'express';
import { getUserInfoHandler, register, updateUser } from './user.controller';

const userRouter = express.Router();

userRouter.post('/', register);
userRouter.put('/:id', updateUser);
userRouter.get('/', getUserInfoHandler);

export default userRouter;