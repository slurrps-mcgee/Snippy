import { NextFunction, Request, Response } from 'express';
import { registerService, updateUserService } from './user.service';
import { validateRegister, validateUpdateUser } from './user.validator';

export async function registerUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateRegister(req.body);

        const { user } = await registerService(req);

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}

export const register = [registerUserHandler];

export async function updateUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateUpdateUser(req.body);

        const auth0Id = req.auth?.payload?.sub;
        if(!auth0Id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Prevent updating sensitive fields from this endpoint
        const patch = { ...req.body } as any;
        delete patch.userId;
        delete patch.is_admin;

        const user = await updateUserService(auth0Id, patch);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

export const updateUser = [updateUserHandler];