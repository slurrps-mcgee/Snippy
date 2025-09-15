import { NextFunction, Request, Response } from 'express';
import { 
    generateInviteService, 
    markInviteUsedService, 
    validateInviteService 
} from './invite.service';
import jwtCheck from '../../middleware/jwt.service';

export const generateInvite = [
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;
            const response = await generateInviteService(email);

            res.status(201).json({
                success: true,
                message: response.message,
            });
        } catch (error) {
            next(error);
        }
    }
];

export const validateInvite = [
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { code } = req.body;
            const response = await validateInviteService(code);

            res.status(200).json({
                success: true,
                message: response.message,
                data: response.invite, // includes invite details if needed
            });
        } catch (error) {
            next(error);
        }
    }
];

export const markInviteUsed = [
    jwtCheck,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, code } = req.body;
            const response = await markInviteUsedService(email, code);

            res.status(200).json({
                success: true,
                message: response.message,
            });
        } catch (error) {
            next(error);
        }
    }
];
