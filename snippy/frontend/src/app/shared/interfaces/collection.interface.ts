import { SnippetList } from './snippetList.interface';

export interface Collection {
  collectionId: string;
  shortId: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isOwner: boolean;
  userName?: string;
  displayName?: string;
  snippetCount?: number;
  containsSnippet?: boolean;
  snippets?: SnippetList[];
}

export interface CollectionListResponse {
  success: boolean;
  collections: Collection[];
  totalCount: number;
}

export interface CollectionResponse {
  success: boolean;
  collection: Collection;
  message?: string;
}
