import { SnippetListDTO } from '../../snippet/dto/snippet.dto';

export interface CollectionDTO {
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
  snippets?: SnippetListDTO[];
}

export interface CreateCollectionRequest {
  name: string;
  description?: string | null;
  isPrivate?: boolean;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string | null;
  isPrivate?: boolean;
}

export interface AddCollectionSnippetRequest {
  snippetId: string;
}

export interface ReorderCollectionSnippetsRequest {
  snippetIds: string[];
}
