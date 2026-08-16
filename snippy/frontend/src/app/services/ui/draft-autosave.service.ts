import { Injectable } from '@angular/core';
import type { CdnResource } from '@app/api/generated/models/cdn-resource';
import type { Snippet } from '@app/api/generated/models/snippet';
import type { SnippetFile } from '@app/api/generated/models/snippet-file';

export const DRAFT_TRY_KEY = 'snippy.draft.try';
export const DRAFT_NEW_KEY = 'snippy.draft.new';
const DRAFT_SAVED_PREFIX = 'snippy.draft.';
const MAX_BYTES = 400_000;

export interface SnippetDraft {
  name?: string;
  description?: string | null;
  isPrivate?: boolean;
  tags?: string[];
  snippetFiles?: SnippetFile[];
  cdnResources?: CdnResource[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DraftAutosaveService {
  keyFor(opts: { guest: boolean; shortId?: string | null }): string {
    if (opts.guest) return DRAFT_TRY_KEY;
    const shortId = opts.shortId?.trim() || null;
    if (shortId) return `${DRAFT_SAVED_PREFIX}${shortId}`;
    return DRAFT_NEW_KEY;
  }

  read(key: string): SnippetDraft | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SnippetDraft;
      if (!parsed?.updatedAt) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  write(key: string, draft: SnippetDraft): boolean {
    try {
      const payload = JSON.stringify(draft);
      if (payload.length > MAX_BYTES) return false;
      localStorage.setItem(key, payload);
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore quota / private mode */
    }
  }

  persistFromSnippet(key: string, snippet: Snippet) {
    return this.write(key, {
      name: snippet.name,
      description: snippet.description,
      isPrivate: snippet.isPrivate,
      tags: snippet.tags ?? [],
      snippetFiles: snippet.snippetFiles,
      cdnResources: snippet.cdnResources,
      updatedAt: new Date().toISOString(),
    });
  }

  shouldRestore(draft: SnippetDraft, snippetUpdatedAt?: string | null): boolean {
    if (!snippetUpdatedAt) return true;
    return Date.parse(draft.updatedAt) > Date.parse(snippetUpdatedAt);
  }

  applyToSnippet(snippet: Snippet, draft: SnippetDraft): Snippet {
    return {
      ...snippet,
      name: draft.name ?? snippet.name,
      description: draft.description ?? snippet.description,
      isPrivate: draft.isPrivate ?? snippet.isPrivate,
      tags: draft.tags ?? snippet.tags,
      snippetFiles: draft.snippetFiles ?? snippet.snippetFiles,
      cdnResources: draft.cdnResources ?? snippet.cdnResources,
    };
  }

  /** Carry guest /try work into the authenticated new-pen editor. */
  promoteTryToNew() {
    const draft = this.read(DRAFT_TRY_KEY);
    if (!draft) return;
    this.write(DRAFT_NEW_KEY, draft);
    this.remove(DRAFT_TRY_KEY);
  }
}
