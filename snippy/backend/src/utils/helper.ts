import { findByUsername } from "../modules/user/user.repo";


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