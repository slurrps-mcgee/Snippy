import { NextFunction, Request, Response } from 'express';
import { 
    checkUserNameAvailabilityHandler, 
    deleteUserHandler, 
    ensureUserHandler, 
    getCurrentUserHandler, 
    getUserProfileHandler, 
    updateUserHandler 
} from './user.service';
import { validateRegister, validateUpdateUser } from './user.validator';


export async function ensureUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await validateRegister(req.body);

        const result = await ensureUserHandler(req);
        const status = result?.created ? 201 : 200;
        const user = result?.user;

        res.status(status).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await validateUpdateUser(req.body);

        const { user } = await updateUserHandler(req);

        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await deleteUserHandler(req);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
}

export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { user } = await getUserProfileHandler(req);
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

export async function getCurrentUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { user } = await getCurrentUserHandler(req);
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

export async function checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { available } = await checkUserNameAvailabilityHandler(req);
        res.status(200).json({ success: true, available });
    } catch (error) {
        next(error);
    }
}
