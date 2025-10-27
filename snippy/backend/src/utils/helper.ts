import { randomInt } from 'crypto';
import { Users } from '../models/user.model';
import { Snippets } from '../models/snippet.model';
import { customAlphabet } from 'nanoid';
import { CustomError } from './custom-error';

// Nanoid setup for shortId generation
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nano = customAlphabet(alphabet, 6); // 6 chars

// Word lists for username generation
const adjectives = [
	'silver', 'blue', 'brave', 'clever', 'happy', 'swift', 'bright', 'calm', 'lucky', 'gentle'
];
const nouns = [
	'otter', 'falcon', 'lion', 'panda', 'wolf', 'fox', 'tiger', 'hawk', 'bear', 'eagle'
];


// List of usernames that are not allowed
export const invalidUsernames = [
	'snippet'
];

// Supported file types
export enum fileTypes {
	html = 'html',
	css = 'css',
	js = 'js'
};

// Generate a unique username for a user
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

// Generate a unique shortId for a snippet
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

export function handleSequelizeError(err: any): never {
	const name = err?.name;

	if (name === "SequelizeUniqueConstraintError") {
		throw new CustomError("Conflict: unique constraint violated", 409);
	}
	if (name === "SequelizeValidationError") {
		throw new CustomError(err.message || "Validation failed", 400);
	}
	if (name === "SequelizeForeignKeyConstraintError") {
		throw new CustomError("Invalid reference", 400);
	}

	console.error('Sequelize error:', err);
	throw new CustomError("Database error", 500);
}