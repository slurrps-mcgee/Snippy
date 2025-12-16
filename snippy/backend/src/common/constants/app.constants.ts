/**
 * Application-wide constants
 */

// Server Configuration
export const SERVER_PORT = process.env.PORT || 3000;

// Rate Limiting
export const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
} as const;

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
} as const;

// ShortId Generation
export const SHORT_ID = {
    ALPHABET: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    LENGTH: 7,
} as const;

// Username Generation
export const USERNAME = {
    ADJECTIVES: [
        'silver', 'blue', 'brave', 'clever', 'happy', 'swift', 'bright', 'calm', 'lucky', 'gentle'
    ] as readonly string[],
    NOUNS: [
        'otter', 'falcon', 'lion', 'panda', 'wolf', 'fox', 'tiger', 'hawk', 'bear', 'eagle'
    ] as readonly string[],
    INVALID_USERNAMES: ['snippet'] as readonly string[],
};

// File Types
export enum FileType {
    HTML = 'html',
    CSS = 'css',
    JS = 'js',
}
