/**
 * Data Transfer Objects for Snippet module
 */

export interface SnippetFileDTO {
    snippetFileID: string;
    fileType: string;
    content: string;
}

export interface ExternalResourceDTO {
    externalId: string;
    resourceType: string;
    url: string;
}

export interface SnippetDTO {
    shortId: string;
    name: string;
    description: string | null;
    tags: string[] | null;
    isPrivate: boolean;
    forkCount: number;
    viewCount: number;
    commentCount: number;
    favoriteCount: number;
    parentShortId: string | null;
    isOwner: boolean;
    userName?: string;
    displayName?: string;
    snippetFiles?: SnippetFileDTO[];
    externalResources?: ExternalResourceDTO[];
}

export interface SnippetListDTO {
    shortId: string;
    name: string;
    description: string | null;
    tags: string[] | null;
    userName?: string;
    displayName?: string;
    commentCount: number;
    favoriteCount: number;
    viewCount: number;
    isOwner: boolean;
}

export interface CreateSnippetRequest {
    name: string;
    description?: string;
    tags?: string[];
    isPrivate?: boolean;
    snippetFiles?: Array<{
        snippetFileID?: string;
        fileType: string;
        content: string;
    }>;
    externalResources?: Array<{
        externalId?: string;
        resourceType: 'html' | 'css' | 'js';
        url: string;
    }>;
}

export interface UpdateSnippetRequest {
    name?: string;
    description?: string;
    tags?: string[];
    isPrivate?: boolean;
    snippetFiles?: Array<{
        snippetFileID?: string;
        fileType: string;
        content: string;
    }>;
    externalResources?: Array<{
        externalId?: string;
        resourceType: 'css' | 'js';
        url: string;
    }>;
}
