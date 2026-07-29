export interface CreateResourceRequest {
    subFolder?: string;
}

export const ALLOWED_ASSET_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
] as const;

export const MAX_ASSET_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
