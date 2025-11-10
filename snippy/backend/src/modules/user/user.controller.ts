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

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - User
 *     summary: Ensure (create) a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               pictureUrl:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User created or returned
 *       '400':
 *         description: Validation error
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

/**
 * @swagger
 * /users:
 *   put:
 *     tags:
 *       - User
 *     summary: Update current user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               pictureUrl:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Updated user
 *       '401':
 *         description: Unauthorized
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

/**
 * @swagger
 * /users:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User deleted
 *       '401':
 *         description: Unauthorized
 */
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await deleteUserHandler(req);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /users/{userName}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get a user's public profile by userName
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Public user profile
 *       '404':
 *         description: Not found
 */
export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { user } = await getUserProfileHandler(req);
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current user's profile (from token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Current user profile
 *       '401':
 *         description: Unauthorized
 */
export async function getCurrentUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { user } = await getCurrentUserHandler(req);
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /users/check-username/{userName}:
 *   get:
 *     tags:
 *       - User
 *     summary: Check if a username is available
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Username availability
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 */
export async function checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { available } = await checkUserNameAvailabilityHandler(req);
        res.status(200).json({ success: true, available });
    } catch (error) {
        next(error);
    }
}
