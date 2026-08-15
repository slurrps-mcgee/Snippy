import { NextFunction, Request, Response } from 'express';
import {
    followUserHandler,
    unfollowUserHandler,
    getFollowersHandler,
    getFollowingHandler,
} from './follow.service';
import { validateFollowUserName } from './follow.validator';

/**
 * @swagger
 * /users/{userName}/follow:
 *   post:
 *     tags: [Follow]
 *     summary: Follow a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Now following (or already following)
 *       400:
 *         description: Invalid username or cannot follow yourself
 *       403:
 *         description: Target profile is private
 *       404:
 *         description: User not found
 */
export async function followUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateFollowUserName(req.params);
        const { message, isFollowing } = await followUserHandler(req);
        res.status(200).json({ success: true, message, isFollowing });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /users/{userName}/follow:
 *   delete:
 *     tags: [Follow]
 *     summary: Unfollow a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfollowed
 *       404:
 *         description: User not found
 */
export async function unfollowUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateFollowUserName(req.params);
        const { message, isFollowing } = await unfollowUserHandler(req);
        res.status(200).json({ success: true, message, isFollowing });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /users/{userName}/followers:
 *   get:
 *     tags: [Follow]
 *     summary: List followers of a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follower list
 *       403:
 *         description: Profile is private
 *       404:
 *         description: User not found
 */
export async function getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateFollowUserName(req.params);
        const { users, totalCount } = await getFollowersHandler(req);
        res.status(200).json({ success: true, users, totalCount });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /users/{userName}/following:
 *   get:
 *     tags: [Follow]
 *     summary: List users this profile follows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Following list
 *       403:
 *         description: Profile is private
 *       404:
 *         description: User not found
 */
export async function getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateFollowUserName(req.params);
        const { users, totalCount } = await getFollowingHandler(req);
        res.status(200).json({ success: true, users, totalCount });
    } catch (error) {
        next(error);
    }
}
