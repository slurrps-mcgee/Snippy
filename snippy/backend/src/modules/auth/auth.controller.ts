import { NextFunction, Request, Response } from 'express';
import { registerService, loginService, refreshService } from './auth.service';
import { requestPasswordReset, resetPassword } from './auth.service';
import { validateRegister, validateLogin, ValidateForgotPassword, ValidateResetPassword } from './auth.validator';
import { findById } from '../user/user.repo';
import { setAuthCookies } from '../../utils/helper';

const sanitize = (user: any) => {
	if (!user) return null;
	const u = user.toJSON ? user.toJSON() : { ...user };
	delete u.password;
	delete u.salt;
	return u;
}

// Registration endpoint
export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		await validateRegister(req.body);

		const { email, password, inviteCode } = req.body;
		const { user, accessToken, refreshToken } = await registerService(email, password, inviteCode);

		setAuthCookies(res, accessToken, refreshToken);
		res.status(201).json({ success: true, data: { user: sanitize(user) } });
	} catch (error) {
		next(error);
	}
}

export const register = [registerHandler];

// Login endpoint
export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		await validateLogin(req.body);

		const { email, password } = req.body;
		const { user, accessToken, refreshToken } = await loginService(email, password);

		setAuthCookies(res, accessToken, refreshToken);
		res.status(200).json({ success: true, data: { user: sanitize(user) } });
	} catch (error) {
		next(error);
	}
}

export const login = [loginHandler];

// Password reset endpoints
export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction) {
	try {
		await ValidateForgotPassword(req.body);

		const { email } = req.body;
		await requestPasswordReset(email, process.env.FRONTEND_ORIGIN);
		// Always return success
		res.status(200).json({ success: true });
	} catch (err) {
		next(err);
	}
}

export const forgotPasswordRoute = [forgotPasswordHandler];

// Reset password with token
export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
	try {
		await ValidateResetPassword(req.body);

		const { token, password } = req.body;
		if (!token || !password) return res.status(400).json({ error: 'token and password required' });
		await resetPassword(token, password);
		res.status(200).json({ success: true, message: 'Password reset successful' });
	} catch (err) {
		next(err);
	}
}

export const resetPasswordRoute = [resetPasswordHandler];

// Refresh JWT token endpoint
export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
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

export const refreshToken = [refreshTokenHandler];

// AuthGaurd Check
export async function meHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
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

export const me = [meHandler];