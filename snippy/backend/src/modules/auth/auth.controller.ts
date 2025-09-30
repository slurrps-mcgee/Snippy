import { NextFunction, Request, Response } from 'express';
import { registerService, loginService } from './auth.service';
import { validateRegister, validateLogin } from './auth.validator';
import { findById } from '../user/user.repo';

const sanitize = (user: any) => {
	if (!user) return null;
	const u = user.toJSON ? user.toJSON() : { ...user };
	delete u.password;
	delete u.salt;
	return u;
}

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

export const me = [
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			// jwt middleware attaches payload to req.auth.payload
			const auth = (req as any).auth;
			const payload = auth && auth.payload;
			if (!payload || !payload.sub) {
				res.status(401).json({ success: false, error: 'Unauthorized' });
				return;
			}

			const user = await findById(payload.sub);
			if (!user) {
				res.status(404).json({ success: false, error: 'User not found' });
				return;
			}

			res.status(200).json({ success: true, data: { user: sanitize(user) } });
			return;
		} catch (error) {
			next(error);
		}
	}
];
