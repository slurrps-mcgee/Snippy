import { NextFunction, Request, Response } from 'express';
import { generateInviteService } from './invite.service';
import { validateGenerate } from './invite.validator';
import { getOrigin } from '../../utils/helper';

export async function generateInviteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        validateGenerate(req.body);
        
        const response = await generateInviteService(req);

        res.status(201).json({ success: true, message: response.message });
    } catch (error) {
        next(error);
    }
}

export const generateInvite = [ generateInviteHandler ];