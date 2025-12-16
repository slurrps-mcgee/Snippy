/**
 * Data Transfer Objects for Snippet module
 */

export interface SnippetFileDTO {
    fileType: string;
    content: string;
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
    displayName?: string;
    snippetFiles?: SnippetFileDTO[];
}

export interface SnippetListDTO {
    shortId: string;
    name: string;
    description: string | null;
    tags: string[] | null;
    userName?: string;
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
        fileType: string;
        content: string;
    }>;
}

export interface UpdateSnippetRequest {
    name?: string;
    description?: string;
    tags?: string[];
    isPrivate?: boolean;
    snippetFiles?: Array<{
        fileType: string;
        content: string;
    }>;
}
