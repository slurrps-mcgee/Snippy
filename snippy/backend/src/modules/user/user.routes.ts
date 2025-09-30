import express from 'express';
import { updateUser } from './user.controller';

const userRouter = express.Router();

userRouter.put('/:id', updateUser);

export default userRouter;