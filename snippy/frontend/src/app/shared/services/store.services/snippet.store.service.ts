import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Snippet } from '../../interfaces/snippet.interface';
import { ExternalResource } from '../../interfaces/externalResource.interface';
import { SnippetAPIService } from '../api.services/snippet.api.service';
import { FavoriteService } from '../api.services/favorite.api.service';
import { SnippetListResponse } from '../../interfaces/snippetListResponse.interface';
import { FavoriteResponse } from '../../interfaces/favoriteResponse.interface';


@Injectable({ providedIn: 'root' })
export class SnippetStoreService {
  snippet = signal<Snippet | null>(null);
  snippetList = signal<SnippetListResponse | null>(null);
  previewUpdateType = signal<string | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private originalSnippet = signal<Snippet | null>(null);
  private snippetService = inject(SnippetAPIService);
  private favoriteService = inject(FavoriteService);

  //#region API Methods
  // Load a snippet by id (store pattern, async)
  async loadSnippet(snippetId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.snippetService.getSnippet(snippetId));
      if (res?.snippet) {
        this.setSnippet(res.snippet, true);
      }
      this.loading.set(false);
    } catch (err) {
      this.error.set('Failed to load snippet');
      this.loading.set(false);
    }
  }

  // Load user snippets and update snippetList
  async loadUserSnippets(page: number, limit: number) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.snippetService.getUserSnippets(page, limit));
      this.snippetList.set(res ?? null);
      this.loading.set(false);
      return res;
    } catch (err) {
      this.error.set('Failed to load user snippets');
      this.snippetList.set(null);
      this.loading.set(false);
      throw err;
    }
  }

  // Load public snippets and update snippetList
  async loadPublicSnippets(page: number, limit: number) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.snippetService.getPublicSnippets(page, limit));
      this.snippetList.set(res ?? null);
      this.loading.set(false);
      return res;
    } catch (err) {
      this.error.set('Failed to load public snippets');
      this.snippetList.set(null);
      this.loading.set(false);
      throw err;
    }
  }

  // Search snippets and update snippetList
  async searchSnippets(query: string, page: number, limit: number) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.snippetService.searchSnippets(query, page, limit));
      this.snippetList.set(res ?? null);
      this.loading.set(false);
      return res;
    } catch (err) {
      this.error.set('Failed to search snippets');
      this.snippetList.set(null);
      this.loading.set(false);
      throw err;
    }
  }

  // Save the current snippet (store pattern, async)
  async saveSnippet() {
    const s = this.snippet();
    if (!s) throw new Error('No snippet to save');
    this.loading.set(true);
    this.error.set(null);
    try {
      let res = await firstValueFrom(this.snippetService.saveSnippet(s));
      if (!s.snippetId) {
        this.setSnippet(res.snippet, true);
      } else {
        this.setSnippet(res.snippet, false);
      }
      this.loading.set(false);
      return res;
    } catch (err) {
      this.error.set('Failed to save snippet');
      this.loading.set(false);
      throw err;
    }
  }

  // Delete a snippet by id (store pattern, async)
  async deleteSnippet(snippetId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.snippetService.deleteSnippet(snippetId));
      // Remove the deleted snippet from the snippetList signal
      this.snippetList.update(list => {
        if (!list) return list;
        return {
          ...list,
          snippets: list.snippets.filter(s => s.snippetId !== snippetId),
          totalCount: Math.max(0, (list.totalCount ?? 0) - 1)
        };
      });
      this.clearSnippet();
      this.loading.set(false);
    } catch (err) {
      this.error.set('Failed to delete snippet');
      this.loading.set(false);
      throw err;
    }
  }

  // Favorite a snippet and update favorite count
  async favoriteSnippet(snippetId: string): Promise<FavoriteResponse | undefined> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.favoriteService.favoriteSnippet(snippetId)) as FavoriteResponse;
      if (response && typeof response.favoriteCount === 'number') {
        this.snippet.update(s => s ? { ...s, favoriteCount: response.favoriteCount } : s);
      }
      this.loading.set(false);
      return response;
    } catch (err) {
      this.error.set('Failed to favorite snippet');
      this.loading.set(false);
      throw err;
    }
  }
  //#endregion API Methods

  // Determine if the snippet has unsaved changes
  isDirty = computed(() => {
    const s = this.snippet();
    const o = this.originalSnippet();
    if (!s || !o) return false;
    if (s.name !== o.name) return true;
    if (s.description !== o.description) return true;
    if (s.isPrivate !== o.isPrivate) return true;
    if (s.tags.length !== o.tags.length) return true;
    for (let i = 0; i < s.tags.length; i++) {
      if (s.tags[i] !== o.tags[i]) return true;
    }
    if (s.snippetFiles.length !== o.snippetFiles.length) return true;
    for (let i = 0; i < s.snippetFiles.length; i++) {
      if (s.snippetFiles[i].content !== o.snippetFiles[i].content) return true;
    }
    return false;
  });

  // Set the current snippet
  setSnippet(snippet: Snippet, updatePreview: boolean = false) {
    // Ensure tags is always an array
    if (!snippet.tags) {
      snippet.tags = [];
    }
    this.snippet.set(snippet);
    this.originalSnippet.set(JSON.parse(JSON.stringify(snippet)));
    // If updating from API response, trigger preview update for all code files
    if (updatePreview) {
      this.previewUpdateType.set('full'); // Set to trigger preview update
    }
  }

  //#region Update Methods 
  // Update the content of a specific snippet file
  updateSnippetFile(fileType: string, content: string) {
    this.previewUpdateType.set((fileType.toLowerCase() === 'html' || fileType.toLowerCase() === 'js') ? 'full' : 'partial');
    this.snippet.update(s => ({
      ...s!,
      snippetFiles: s!.snippetFiles.map(f =>
        f.fileType === fileType ? { ...f, content } : f
      )
    }));
  }

  // Update snippet name
  updateSnippetName(name: string) {
    this.previewUpdateType.set(null);
    this.snippet.update(s => ({ ...s!, name }));
  }

  // Update snippet settings: description, isPrivate, tags
  updateSnippetSettings(settings: { description: string; isPrivate: boolean; tags: string[]; externalResources?: ExternalResource[] }) {
    this.previewUpdateType.set(null);
    this.snippet.update(s => ({
      ...s!,
      description: settings.description,
      isPrivate: settings.isPrivate,
      tags: settings.tags,
      externalResources: settings.externalResources ?? s!.externalResources
    }));
  }

  // Update snippet counts
  updateSnippetCounts(counts: { forkCount?: number; viewCount?: number; commentCount?: number; favoriteCount?: number }) {
    this.snippet.update(s => ({
      ...s!,
      forkCount: counts.forkCount !== undefined ? counts.forkCount : s!.forkCount,
      viewCount: counts.viewCount !== undefined ? counts.viewCount : s!.viewCount,
      commentCount: counts.commentCount !== undefined ? counts.commentCount : s!.commentCount,
      favoriteCount: counts.favoriteCount !== undefined ? counts.favoriteCount : s!.favoriteCount,
    }));
  }

  // Clear the current snippet
  clearSnippet() {
    this.snippet.set(null);
    this.originalSnippet.set(null);
    this.previewUpdateType.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  //#endregion Update Methods
}
