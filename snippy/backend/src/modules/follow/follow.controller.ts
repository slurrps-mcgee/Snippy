import { NextFunction, Request, Response } from 'express';
import {
    followUserHandler,
    unfollowUserHandler,
    getFollowersHandler,
    getFollowingHandler,
} from './follow.service';

export async function followUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { message, isFollowing } = await followUserHandler(req);
        res.status(200).json({ success: true, message, isFollowing });
    } catch (error) {
        next(error);
    }
}

export async function unfollowUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { message, isFollowing } = await unfollowUserHandler(req);
        res.status(200).json({ success: true, message, isFollowing });
    } catch (error) {
        next(error);
    }
}

export async function getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { users, totalCount } = await getFollowersHandler(req);
        res.status(200).json({ success: true, users, totalCount });
    } catch (error) {
        next(error);
    }
}

export async function getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { users, totalCount } = await getFollowingHandler(req);
        res.status(200).json({ success: true, users, totalCount });
    } catch (error) {
        next(error);
    }
}
