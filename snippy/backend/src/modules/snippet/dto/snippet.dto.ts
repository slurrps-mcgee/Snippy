/**
 * Data Transfer Objects for Snippet module
 */

export interface SnippetFileDTO {
    snippetFileID: string;
    fileType: string;
    content: string;
}

export interface ExternalResource {
    resourceType: 'css' | 'js' | 'other';
    url: string;
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
    parentName?: string | null;
    parentUserName?: string | null;
    isOwner: boolean;
    isFavorited?: boolean;
    userName?: string;
    displayName?: string;
    snippetFiles?: SnippetFileDTO[];
    externalResources?: ExternalResource[];
}

export type SnippetSort = 'newest' | 'views' | 'favorites' | 'forks';

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
    parentShortId: string | null;
    parentName: string | null;
    parentUserName: string | null;
    isOwner: boolean;
    isFavorited?: boolean;
    isFollowing?: boolean;
}

export interface SnippetListQuery {
    page?: number | string;
    limit?: number | string;
    sort?: SnippetSort | string;
    tag?: string;
    q?: string;
    name?: string;
    description?: string;
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
    externalResources?: ExternalResource[];
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
    externalResources?: ExternalResource[];
}
