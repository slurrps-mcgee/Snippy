import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * @param input - The string to sanitize
 * @returns Sanitized string with HTML tags stripped or escaped
 */
export const sanitizeInput = (input: string | null | undefined): string | null => {
    if (!input || typeof input !== 'string') {
        return input ?? null;
    }

    // Configure DOMPurify to strip all HTML tags and only allow plain text
    const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [], // No attributes allowed
        KEEP_CONTENT: true, // Keep text content even when removing tags
    });

    return sanitized.trim();
};

/**
 * Sanitize an array of strings
 * @param inputs - Array of strings to sanitize
 * @returns Array of sanitized strings
 */
export const sanitizeInputArray = (inputs: string[] | null | undefined): string[] | null => {
    if (!inputs || !Array.isArray(inputs)) {
        return inputs ?? null;
    }

    return inputs.map(input => sanitizeInput(input) ?? '').filter(input => input.length > 0);
};

/**
 * Sanitize user-generated content while allowing limited markdown-style formatting
 * Useful for descriptions that might benefit from basic formatting
 * @param input - The string to sanitize
 * @returns Sanitized string with limited HTML allowed
 */
export const sanitizeWithLimitedHTML = (input: string | null | undefined): string | null => {
    if (!input || typeof input !== 'string') {
        return input ?? null;
    }

    // Allow only safe HTML tags for basic formatting
    const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'br'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    });

    return sanitized.trim();
};
