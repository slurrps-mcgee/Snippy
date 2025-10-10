import { findByUsername } from "../modules/user/user.repo";
import { Request } from 'express';


export const createUniqueUsername = async (base: string, maxTries = 20) => {
	const cleanBase = (base || 'user').replace(/\s+/g, '').toLowerCase();
	let candidate = cleanBase;
	for (let i = 0; i < maxTries; i++) {
		const suffix = i === 0 ? '' : `${Math.floor(Math.random() * 9000) + 1000}`;
		candidate = `${cleanBase}${suffix}`;
		const exists = await findByUsername(candidate);
		if (!exists) return candidate;
	}
	throw new Error('exhausted username generation attempts');
};

export const setAuthCookies = (res: any, accessToken: string, refreshToken: string) => {
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

export const getOrigin = (req: Request) => {
	const explicitOrigin = req.body?.origin;
	const headerOrigin = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/');
	const frontend = (explicitOrigin || headerOrigin || process.env.FRONTEND_HOST || process.env.FRONTEND_ORIGIN || 'http://localhost:4200').replace(/\/$/, '');
	return frontend;
}