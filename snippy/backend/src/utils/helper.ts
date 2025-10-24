import { randomInt } from 'crypto';
import { Users } from '../models/user.model';
import { Snippets } from '../models/snippet.model';
import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nano = customAlphabet(alphabet, 6); // 6 chars

const adjectives = [
	'silver', 'blue', 'brave', 'clever', 'happy', 'swift', 'bright', 'calm', 'lucky', 'gentle'
];
const nouns = [
	'otter', 'falcon', 'lion', 'panda', 'wolf', 'fox', 'tiger', 'hawk', 'bear', 'eagle'
];


export const invalidUsernames = [
	'snippet'
];

export enum fileTypes {
	html = 'html',
	css = 'css',
	js = 'js'
};


export const createUniqueUsername = async (user: Users, maxTries = 20) => {
	// Base name preference: display_name → email prefix → generated words
	let base: string | undefined;

	if (user.displayName) {
		base = user.displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	} else {
		const adj = adjectives[randomInt(0, adjectives.length)];
		const noun = nouns[randomInt(0, nouns.length)];
		base = `${adj}-${noun}`;
	}

	// Make sure username is unique
	let username: string;
	let exists = true;
	for (let i = 0; i < maxTries; i++) {
		const suffix = randomInt(1000, 9999);
		username = `${base}${base.includes('-') ? '-' : ''}${suffix}`;
		const existing = await Users.findOne({ where: { userName: username } });
		if (!existing) {
			exists = false;
			break;
		}
	}

	if (exists) {
		username = `${base}-${Date.now()}`;
	}

	user.userName = username!;
	console.log(`Generated username: ${user.userName}`);
}

export const createUniqueShortName = async (snippet: Snippets, maxTries = 5) => {
	if (!snippet.shortId) {
		// try generating a unique shortId a few times
		for (let i = 0; i < maxTries; i++) {
			const candidate = nano();
			// try insert-safe uniqueness check: db lookup
			// Note: a findOne on shortId is fine here; the DB unique index prevents final race
			const exists = await Snippets.findOne({ where: { shortId: candidate } });
			if (!exists) {
				snippet.shortId = candidate;
				return;
			}
		}
		// fallback to a longer id if collisions happen repeatedly
		snippet.shortId = `${nano(10)}`;
	}
}

// Sanitize user object by removing sensitive/internal fields
export const sanitizeUser = (user: any) => {
	if (!user) return null;

	// If this is a Sequelize instance, get a plain object copy
	let plain: any;
	try {
		if (typeof user.get === 'function') {
			plain = user.get({ plain: true });
		} else if (typeof user.toJSON === 'function') {
			plain = user.toJSON();
		} else {
			plain = { ...user };
		}
	} catch (e) {
		plain = { ...user };
	}

	// Convert any snake_case keys to camelCase and remove internal fields
	const out: any = {};
	const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

	for (const k of Object.keys(plain)) {
		const camel = toCamel(k);
		out[camel] = (plain as any)[k];
	}

	// Remove internal/sensitive fields if present (both snake and camel forms handled by conversion)
	delete out.auth0Id;
	delete out.isAdmin;
	delete out.createdAt;
	delete out.updatedAt;

	return out;
};