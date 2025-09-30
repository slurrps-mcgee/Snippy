import { NextFunction, Request, Response } from 'express';
import { generateInviteService } from './invite.service';
import { validateInvite } from './invite.validator';

export const generateInvite = [
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            validateInvite(req.body);
            
            const { email } = req.body;
            const response = await generateInviteService(email);

            res.status(201).json({ success: true, data: response });
        } catch (error) {
            next(error);
        }
    },
];