export interface SnippetList {
    snippetId: string;
    shortId: string;
    name: string;
    description: string;
    tags: string[];
    userName: string;
    commentCount: number;
    favoriteCount: number;
    viewCount: number;
    isOwner: boolean;
}