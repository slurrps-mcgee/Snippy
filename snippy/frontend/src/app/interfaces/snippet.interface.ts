import { CdnResource } from "./cdnResource.interface";
import { SnippetFile } from "./snippetfile.interface";

export interface Snippet {
    snippetId?: string | null;
    shortId: string;
    name: string;
    description: string;
    tags: string[];
    isPrivate: boolean;
    forkCount: number;
    viewCount: number;
    commentCount: number;
    favoriteCount: number;
    parentShortId: string;
    parentName?: string | null;
    parentUserName?: string | null;
    isOwner: boolean;
    isFavorited?: boolean;
    userName?: string;
    displayName: string;
    snippetFiles: SnippetFile[];
    cdnResources?: CdnResource[];
    snapshotUrl?: string | null;
    updatedAt?: string;
}
