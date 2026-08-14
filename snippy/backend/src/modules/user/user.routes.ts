import express from 'express';
import { getUserProfile, checkUsername, ensureUser, updateUser, getCurrentUserProfile, deleteUser, updateProfilePicture } from './user.controller';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../follow/follow.controller';
import { authLimiter, publicReadLimiter, writeLimiter } from '../../common/middleware/rate-limit.service';

const userRouter = express.Router();

// Public read operations - higher limit
userRouter.get('/check-username/:userName', publicReadLimiter, checkUsername);

// Authenticated read — must be before /:userName so "me" is not treated as a username
userRouter.get('/me', publicReadLimiter, getCurrentUserProfile);

// Follow graph — more specific than /:userName
userRouter.get('/:userName/followers', publicReadLimiter, getFollowers);
userRouter.get('/:userName/following', publicReadLimiter, getFollowing);
userRouter.post('/:userName/follow', writeLimiter, followUser);
userRouter.delete('/:userName/follow', writeLimiter, unfollowUser);

userRouter.get('/:userName', publicReadLimiter, getUserProfile);

// Authentication endpoint - strictest limit
userRouter.post('/', authLimiter, ensureUser);

userRouter.post('/picture', writeLimiter, updateProfilePicture);

// Write operations - lower limit
userRouter.put('/', writeLimiter, updateUser);
userRouter.delete('/', writeLimiter, deleteUser);

export default userRouter;
