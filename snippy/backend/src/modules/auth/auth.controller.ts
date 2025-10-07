import { NextFunction, Request, Response } from 'express';
import { registerService, loginService, refreshService } from './auth.service';
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
			const { user, accessToken, refreshToken } = await registerService(req.body);

			setAuthCookies(res, accessToken, refreshToken);
			res.status(201).json({ success: true, data: { user } });
		} catch (error) {
			next(error);
		}
	}
];

export const login = [
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			await validateLogin(req.body);
			const { user, accessToken, refreshToken } = await loginService(req.body);

			setAuthCookies(res, accessToken, refreshToken);
			res.status(200).json({ success: true, data: { user } });
		} catch (error) {
			next(error);
		}
	}
];

export const refresh = [
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken) res.status(401).json({ message: 'No refresh token' });

			try {
				const { accessToken, refreshToken: newRefresh } = await refreshService(refreshToken);
				setAuthCookies(res, accessToken, newRefresh);
				res.json({ message: 'Tokens refreshed' });
			} catch {
				res.status(401).json({ message: 'Invalid refresh token' });
			}
		} catch (error) {
			next(error);
		}
	}
]

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

			console.log('Payload from me endpoint:', payload.sub);
			
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

const setAuthCookies = (res: any, accessToken: string, refreshToken: string) => {
	res.cookie('accessToken', accessToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'None',
		maxAge: 15 * 60 * 1000, // 15 min
		path: '/',
	});

	res.cookie('refreshToken', refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'None',
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		path: '/',
	});
}
