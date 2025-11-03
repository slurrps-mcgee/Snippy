import { randomInt } from 'crypto';
import { Users } from '../models/user.model';
import { Snippets } from '../models/snippet.model';
import { customAlphabet } from 'nanoid';
import { CustomError } from './custom-error';
import { shortIdRetryPolicy, usernameRetryPolicy } from './resiliance';

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
export const createUniqueShortName = async (snippet: Snippets) => {
	if (!snippet.shortId) {
		try {
			// Use resilience policy to handle shortId generation with automatic retries
			snippet.shortId = await shortIdRetryPolicy.execute(async () => {
				return await generateShortIdCandidate();
			});
		} catch (error) {
			// If all retries failed, use emergency fallback
			console.error('All shortId generation attempts failed, using emergency fallback');
			snippet.shortId = generateEmergencyShortId();
		}
	}
}

// Internal function to generate and validate a shortId candidate
async function generateShortIdCandidate(): Promise<string> {
	// Try primary 6-character ID
	const candidate = nano(); // 6 characters
	
	// Check uniqueness - if it exists, throw error to trigger retry
	const exists = await Snippets.findOne({ 
		where: { shortId: candidate }
	});
	
	if (exists) {
		// Create an error that matches our resilience policy filter
		const error = new Error(`ShortId collision for candidate: ${candidate}`) as any;
		error.name = 'SequelizeUniqueConstraintError';
		error.fields = { shortId: candidate };
		throw error;
	}
	
	console.log(`Generated unique shortId: ${candidate}`);
	return candidate;
}

// Emergency fallback when all retries are exhausted
function generateEmergencyShortId(): string {
	const timestamp = Date.now().toString(36);
	const randomPart = nano(8);
	const emergencyId = `${randomPart}-${timestamp}`;
	console.error(`Using emergency shortId: ${emergencyId}`);
	return emergencyId;
}

// Handle Sequelize errors and map to CustomError
export function handleSequelizeError(err: any): never {
	const name = err?.name;

	if (name === "SequelizeUniqueConstraintError") {
		// Check if it's specifically a shortId constraint violation
		if (err?.fields?.shortId || err?.message?.includes('short_id')) {
			throw new CustomError("ShortId generation failed - please try again", 500);
		}
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