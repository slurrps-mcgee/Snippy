import { NextFunction, Request, Response } from 'express';
import { registerService, loginService } from './auth.service';
import { validateRegister, validateLogin } from './auth.validator';

export const register = [
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			await validateRegister(req.body);
			const { user, token } = await registerService(req.body);

			res.status(201).json({ success: true, data: { user, token } });
		} catch (error) {
			next(error);
		}
	}
];

export const login = [
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			await validateLogin(req.body);
			const { user, token } = await loginService(req.body);

			res.status(200).json({ success: true, data: { user, token } });
		} catch (error) {
			next(error);
		}
	}
];
