import { NextFunction, Request, Response } from 'express';
import { generateInviteService } from './invite.service';
import { validateGenerate } from './invite.validator';
import sendInviteEmail from '../../utils/email';

export async function generateInviteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateGenerate(req.body);

        const { email } = req.body;
        const response = await generateInviteService(email);

        sendInviteEmail(email, response.invite.code).catch((err) => {
            console.error('Error sending invite email:', err);
        });

        res.status(201).json({ success: true, message: response.message });
    } catch (error) {
        next(error);
    }
}

export const generateInvite = [ generateInviteHandler ];