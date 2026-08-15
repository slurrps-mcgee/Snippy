export interface CreateAssetRequest {
    subFolder?: string;
}

export interface AssetDTO {
    assetId: string;
    fileName: string;
    fileType: string;
    url: string;
    objectKey?: string;
}

export const ALLOWED_ASSET_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
] as const;

export const MAX_ASSET_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/** MinIO prefixes that are not shown in the Assets library. */
export const SYSTEM_SUBFOLDERS = ['profile', 'snippets'] as const;

export function isSystemSubFolder(subFolder: string): boolean {
    return (SYSTEM_SUBFOLDERS as readonly string[]).includes(subFolder);
}

export function isSystemObjectKey(auth0Id: string, objectKey: string): boolean {
    return SYSTEM_SUBFOLDERS.some((folder) => objectKey.startsWith(`${auth0Id}/${folder}/`));
}

export function snippetSnapshotObjectKey(auth0Id: string, snippetId: string): string {
    return `${auth0Id}/snippets/${snippetId}.jpg`;
}
