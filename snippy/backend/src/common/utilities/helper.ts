import { randomInt } from 'crypto';
import { Users } from '../../entities/user.entity';
import { Snippets } from '../../entities/snippet.entity';
import { customAlphabet } from 'nanoid';
import { shortIdRetryPolicy, usernameRetryPolicy } from './resiliance';
import { findByShortId } from '../../modules/snippet/snippet.repo';
import { SHORT_ID, USERNAME, FileType } from '../constants/app.constants';
import logger from './logger';

// Nanoid setup for shortId generation
const nano = customAlphabet(SHORT_ID.ALPHABET, SHORT_ID.LENGTH);

// Re-export for backward compatibility
export const invalidUsernames = USERNAME.INVALID_USERNAMES;
export const fileTypes = FileType;

// Generate a unique username for a user
export const createUniqueUsername = async (user: Users): Promise<void> => {
	// derive base username from displayName or random adjective-noun
	let base: string;

	if (user.displayName) {
		base = user.displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
		if (!base) {
			const adj = USERNAME.ADJECTIVES[randomInt(0, USERNAME.ADJECTIVES.length)];
			const noun = USERNAME.NOUNS[randomInt(0, USERNAME.NOUNS.length)];
			base = `${adj}-${noun}`;
		}
	} else {
		const adj = USERNAME.ADJECTIVES[randomInt(0, USERNAME.ADJECTIVES.length)];
		const noun = USERNAME.NOUNS[randomInt(0, USERNAME.NOUNS.length)];
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

			logger.debug(`Generated unique username candidate: ${candidate}`);
			return candidate;
		});

		user.userName = username;
		logger.debug(`Assigned username: ${user.userName}`);
	} catch (error) {
		// All retries exhausted — fallback to timestamped username
		const fallback = `${base}-${Date.now()}`;
		user.userName = fallback;
		logger.error(`Falling back to emergency username: ${user.userName}`);
	}
};

// Generate a unique shortId for a snippet
export const createUniqueShortName = async (snippet: Snippets): Promise<void> => {
	if (!snippet.shortId) {
		try {
			// Use resilience policy to handle shortId generation with automatic retries
			snippet.shortId = await shortIdRetryPolicy.execute(async () => {
				return await generateShortIdCandidate();
			});
		} catch (error) {
			// If all retries failed, use emergency fallback
			logger.error('All shortId generation attempts failed, using emergency fallback');
			snippet.shortId = generateEmergencyShortId();
		}
	}
}

// Internal function to generate and validate a shortId candidate
async function generateShortIdCandidate(): Promise<string> {
	// Try primary 7-character ID
	const candidate = nano();
	
	// Check uniqueness - if it exists, throw error to trigger retry
	try {
		const exists = await findByShortId(candidate);
		
		if (exists) {
			// Create an error that matches our resilience policy filter
			logger.debug(`ShortId collision detected for: ${candidate}, retrying...`);
			const error = new Error(`ShortId collision for candidate: ${candidate}`) as any;
			error.name = 'SequelizeUniqueConstraintError';
			error.fields = { shortId: candidate };
			throw error;
		}
		
		logger.debug(`Generated unique shortId: ${candidate}`);
		return candidate;
	} catch (error: any) {
		// If it's our collision error, re-throw it for retry
		if (error.name === 'SequelizeUniqueConstraintError') {
			throw error;
		}
		// For other errors (like database connection issues), log and re-throw
		logger.error(`Error checking shortId uniqueness: ${error.message}`);
		throw error;
	}
}

// Emergency fallback when all retries are exhausted
function generateEmergencyShortId(): string {
	// Use timestamp last 6 digits in base36 + random 4 chars = max 11 chars total with dash
	const timestampSuffix = (Date.now() % 1000000).toString(36);
	const randomPart = nano(8);
	const emergencyId = `e-${randomPart}${timestampSuffix}`;
	logger.error(`Using emergency shortId: ${emergencyId}`);
	return emergencyId;
}