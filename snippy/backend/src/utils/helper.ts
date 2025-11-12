import { randomInt } from 'crypto';
import { Users } from '../models/user.model';
import { Snippets } from '../models/snippet.model';
import { customAlphabet } from 'nanoid';
import { shortIdRetryPolicy, usernameRetryPolicy } from './resiliance';
import { findByShortId } from '../modules/snippet/snippet.repo';

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
export const createUniqueUsername = async (user: Users) => {
	// derive base username from displayName or random adjective-noun
	let base: string;

	if (user.displayName) {
		base = user.displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
		if (!base) {
			const adj = adjectives[randomInt(0, adjectives.length)];
			const noun = nouns[randomInt(0, nouns.length)];
			base = `${adj}-${noun}`;
		}
	} else {
		const adj = adjectives[randomInt(0, adjectives.length)];
		const noun = nouns[randomInt(0, nouns.length)];
		base = `${adj}-${noun}`;
	}

	try {
		// Use resilience policy to attempt generation with retries on unique constraint errors
		const username = await usernameRetryPolicy.execute(async () => {
			// create candidate
			const suffix = randomInt(1000, 9999);
			const candidate = `${base}${base.includes('-') ? '-' : ''}${suffix}`;

			// check existence
			const existing = await Users.findOne({ where: { userName: candidate } });
			if (existing) {
				const err = new Error(`Username collision for candidate: ${candidate}`) as any;
				err.name = 'SequelizeUniqueConstraintError';
				err.fields = { userName: candidate };
				throw err;
			}

			console.log(`Generated unique username candidate: ${candidate}`);
			return candidate;
		});

		user.userName = username;
		console.log(`Assigned username: ${user.userName}`);
	} catch (error) {
		// All retries exhausted — fallback to timestamped username
		const fallback = `${base}-${Date.now()}`;
		user.userName = fallback;
		console.error(`Falling back to emergency username: ${user.userName}`);
	}
};

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
	const exists = await findByShortId(candidate);
	
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