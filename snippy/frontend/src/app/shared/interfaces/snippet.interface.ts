import { ExternalResource } from "./externalResource.interface";
import { SnippetFile } from "./snippetfile.interface";

export interface Snippet {
    snippetId?: string | null,
    shortId: string
    name: string,
    description: string
    tags: string[],
    isPrivate: boolean,
    forkCount: number,
    viewCount: number,
    commentCount: number,
    favoriteCount: number,
    parentShortId: string,
    isOwner: boolean,
    displayName: string,
    snippetFiles: SnippetFile[];
    externalResources?: ExternalResource[];
}