export interface SnippetList {
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
    isFavorited?: boolean;
    isFollowing?: boolean;
    parentShortId?: string | null;
    parentName?: string | null;
    parentUserName?: string | null;
    snapshotUrl?: string | null;
    updatedAt?: string;
}
