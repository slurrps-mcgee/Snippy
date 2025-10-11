import { findByUsername } from "../modules/user/user.repo";
import { Request } from 'express';


export const createUniqueUsername = async (email: string, maxTries = 20) => {
	const userNameBase = (email.split('@')[0] || '').replace(/\s+/g, '').toLowerCase();
	const cleanBase = (userNameBase || 'user').replace(/\s+/g, '').toLowerCase();
	let candidate = cleanBase;
	for (let i = 0; i < maxTries; i++) {
		const suffix = i === 0 ? '' : `${Math.floor(Math.random() * 9000) + 1000}`;
		candidate = `${cleanBase}${suffix}`;
		const exists = await findByUsername(candidate);
		if (!exists) return candidate;
	}
	throw new Error('exhausted username generation attempts');
};

export const getOrigin = (req: Request) => {
	const explicitOrigin = req.body?.origin;
	const headerOrigin = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/');
	const frontend = (process.env.FRONTEND_HOST ||explicitOrigin || headerOrigin || 'http://localhost:4200').replace(/\/$/, '');
	return frontend;
}