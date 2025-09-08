import { NextFunction, Request, Response } from 'express';
import { generateInviteService, markInviteUsedService, validateInviteService } from './invite.service';
import jwtCheck from '../../middleware/jwt.service';

export const generateInvite = [
    jwtCheck,
    async (req: Request, res: Response, next: NextFunction,): Promise<void> => {
        try {
            const { email } = req.body;
            const response = await generateInviteService(email);

            res.status(201).json({
                message: 'Successfully invited user',
                data: response.message
            });
        } catch (error) {
            next(error);
        }
    }
];

// Protected endpoint example
export const validateInvite = [
    jwtCheck, // this will verify the token before reaching the handler
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // At this point, jwtCheck has verified the token
            const { code } = req.body; // destructure code from body
            const reponse = await validateInviteService(code);
            res.status(200).json({ message: 'Invite token is valid' })
        } catch (error) {
            next(error);
        }

    }
];

export const markInviteUsed = [
    jwtCheck, // this will verify the token before reaching the handler
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // At this point, jwtCheck has verified the token
            const { email, code } = req.body; // destructure code from body
            // Call the service to mark the invite as used
            const reponse = await markInviteUsedService(email, code);
            res.status(200).json({ message: 'Invite token is valid' })
        } catch (error) {
            next(error);
        }
    }
];