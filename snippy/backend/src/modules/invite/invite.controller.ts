import { NextFunction, Request, Response } from 'express';
import { generateInviteService } from './invite.service';
import { validateGenerate } from './invite.validator';
import sendInviteEmail from '../../utils/email';

export const generateInvite = [
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            validateGenerate(req.body);

            const { email } = req.body;
            const response = await generateInviteService(email);

            sendInviteEmail(email, response.invite.code).catch((err) => {
                console.error('Error sending invite email:', err);
            });

            res.status(201).json({ success: true, data: response });
        } catch (error) {
            next(error);
        }
    },
];

// export const validateInviteCode = [
//     async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//         try {
//             validateCode;(req.body);
//             const { code } = req.body;
//             const response = await validateInviteService(code);

//             res.status(200).json({ success: true, message: 'Valid invite code' });
//         } catch (error) {
//             next(error);
//         }
//     }
// ];