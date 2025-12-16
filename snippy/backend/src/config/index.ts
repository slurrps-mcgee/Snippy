import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Centralized configuration for the application
 * All environment variables should be accessed through this config object
 */
export const config = {
    // Server Configuration
    server: {
        port: Number(process.env.PORT) || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
    },

    // Database Configuration
    database: {
        name: process.env.DB_NAME || 'snippy',
        username: process.env.DB_USER || 'snippy_api',
        password: process.env.DB_PASS,
        host: process.env.DB_HOST || 'db',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql' as const,
    },

    // Auth0 Configuration
    auth: {
        domain: process.env.AUTH0_DOMAIN!,
        audience: process.env.AUTH0_AUDIENCE || 'http://localhost:3000',
    },

    // Frontend Configuration
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:4200',
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        authWindowMs: 15 * 60 * 1000, // 15 minutes for auth endpoints
        global: 200, // Global baseline limit
        publicReads: 150, // Higher limit for browsing/reading
        writes: 50, // Lower limit for write operations
        auth: 20, // Strictest limit for authentication
        search: 60, // Moderate limit for search operations
    },

    // Pagination
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
    },

    // ShortId Generation
    shortId: {
        alphabet: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        length: 7,
    },

    // Username Generation
    username: {
        adjectives: [
            'silver', 'blue', 'brave', 'clever', 'happy', 'swift', 'bright', 'calm', 'lucky', 'gentle'
        ] as readonly string[],
        nouns: [
            'otter', 'falcon', 'lion', 'panda', 'wolf', 'fox', 'tiger', 'hawk', 'bear', 'eagle'
        ] as readonly string[],
        invalidUsernames: ['snippet'] as readonly string[],
    },

    // Logging
    logging: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
} as const;

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
export function validateConfig(): void {
    const required = [
        { key: 'AUTH0_DOMAIN', value: process.env.AUTH0_DOMAIN },
        { key: 'DB_PASS', value: process.env.DB_PASS },
    ];

    const missing = required.filter(({ value }) => !value);

    if (missing.length > 0) {
        const missingKeys = missing.map(({ key }) => key).join(', ');
        throw new Error(`Missing required environment variables: ${missingKeys}`);
    }
}
