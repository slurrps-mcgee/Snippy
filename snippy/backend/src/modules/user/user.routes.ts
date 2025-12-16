import express from 'express';
import { getUserProfile, checkUsername, ensureUser, updateUser, getCurrentUserProfile, deleteUser } from './user.controller';
import { authLimiter, publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const userRouter = express.Router();

// Public read operations - higher limit
userRouter.get('/check-username/:userName', publicReadLimiter, checkUsername);
userRouter.get('/:userName', publicReadLimiter, getUserProfile);

// Authenticated read operations
userRouter.get('/me', publicReadLimiter, getCurrentUserProfile);

// Authentication endpoint - strictest limit
userRouter.post('/', authLimiter, ensureUser);

// Write operations - lower limit
userRouter.put('/', writeLimiter, updateUser);
userRouter.delete('/', writeLimiter, deleteUser);

export default userRouter;