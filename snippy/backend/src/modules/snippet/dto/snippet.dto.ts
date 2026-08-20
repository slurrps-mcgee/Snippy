/**
 * Data Transfer Objects for Snippet module
 */

export interface SnippetFileDTO {
  snippetFileID: string;
  fileType: string;
  content: string;
}

export interface CdnResource {
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
  parentDeleted?: boolean;
  isOwner: boolean;
  isFavorited?: boolean;
  userName?: string;
  displayName?: string;
  snippetFiles?: SnippetFileDTO[];
  cdnResources?: CdnResource[];
  snapshotUrl?: string | null;
  embedCount?: number;
  shareToken?: string | null;
  updatedAt?: string;
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
  forkCount?: number;
  parentShortId: string | null;
  parentName: string | null;
  parentUserName: string | null;
  parentDeleted?: boolean;
  isOwner: boolean;
  isFavorited?: boolean;
  isFollowing?: boolean;
  snapshotUrl?: string | null;
  embedCount?: number;
  updatedAt?: string;
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
  cdnResources?: CdnResource[];
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
  cdnResources?: CdnResource[];
}
