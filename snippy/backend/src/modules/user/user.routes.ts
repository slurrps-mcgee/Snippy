import express from 'express';
import { getUserProfile, checkUsername, ensureUser, updateUser, getCurrentUserProfile, deleteUser } from './user.controller';
import { authLimiter, publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const userRouter = express.Router();

// Public read operations - higher limit
userRouter.get('/check-username/:userName', publicReadLimiter, checkUsername);

// Authenticated read — must be before /:userName so "me" is not treated as a username
userRouter.get('/me', publicReadLimiter, getCurrentUserProfile);
userRouter.get('/:userName', publicReadLimiter, getUserProfile);

// Authentication endpoint - strictest limit
userRouter.post('/', authLimiter, ensureUser);

// Write operations - lower limit
userRouter.put('/', writeLimiter, updateUser);
userRouter.delete('/', writeLimiter, deleteUser);

export default userRouter;