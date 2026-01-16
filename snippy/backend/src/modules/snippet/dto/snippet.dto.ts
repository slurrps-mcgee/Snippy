/**
 * Data Transfer Objects for Snippet module
 */

export interface SnippetFileDTO {
    snippetFileID: string;
    fileType: string;
    content: string;
}

export interface SnippetDTO {
    snippetId: string;
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
    externalResources?: string[];
}

export interface SnippetListDTO {
    snippetId: string;
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
