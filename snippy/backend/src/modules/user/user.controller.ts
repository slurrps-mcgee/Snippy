import { NextFunction, Request, Response } from 'express';
import { checkUserNameAvailabilityHandler, ensureUserHandler, updateUserHandler } from './user.service';
import { validateRegister, validateUpdateUser } from './user.validator';

/*
    * Controller for user registration
    * Will try and find an existing user by Auth0 ID then try and update their profile picture else create a new user
    * Validates input, calls service, and sends response
    * Returns the created or updated user object
 */
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

/*
    * Controller for updating user profile
    * Will try and find an existing user by Auth0 ID then try and update their profile details
    * Validates input, calls service, and sends response
    * Returns the updated user object
 */
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await validateUpdateUser(req.body);

        const { user } = await updateUserHandler(req);

        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

/*
    * Controller for checking username availability
    * Calls service and sends response
    * Returns boolean indicating availability
 */
export async function checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const username = req.params.username;
        const isAvailable = await checkUserNameAvailabilityHandler(username);
        res.status(200).json({ success: true, isAvailable });
    } catch (error) {
        next(error);
    }
}
