import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Snippet } from '@app/interfaces/snippet.interface';
import { ExternalResource } from '@app/interfaces/externalResource.interface';
import { SnippetAPIService, SnippetSort } from '@app/services/api/snippet.api.service';
import { FavoriteService } from '@app/services/api/favorite.api.service';
import { SnippetListResponse } from '@app/interfaces/snippetListResponse.interface';
import { FavoriteResponse } from '@app/interfaces/favoriteResponse.interface';
import { SnippetResponse } from '@app/interfaces/snippetResponse.interface';
import { SnippetList } from '@app/interfaces/snippetList.interface';

/**
 * Global snippet domain store (root singleton).
 *
 * Ownership rules:
 * - Call `loadSnippet(id)` / list loaders to populate.
 * - Editor / fullpage views should call `clearSnippet()` on destroy
 *   so list pages do not see a stale open pen.
 */
@Injectable({ providedIn: 'root' })
export class SnippetStoreService {
  snippet = signal<Snippet | null>(null);
  snippetList = signal<SnippetListResponse | null>(null);
  favoritesList = signal<SnippetListResponse | null>(null);
  previewUpdateType = signal<string | null>(null);
  loading = signal<boolean>(false);
  favoritesLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  private originalSnippet = signal<Snippet | null>(null);
  private listGeneration = 0;
  private favoritesGeneration = 0;
  private detailGeneration = 0;
  private snippetService = inject(SnippetAPIService);
  private favoriteService = inject(FavoriteService);

  //#region API Methods
  async loadSnippet(snippetId: string) {
    const gen = ++this.detailGeneration;
    this.loading.set(true);
    this.error.set(null);
    this.snippet.set(null);
    this.originalSnippet.set(null);
    try {
      const res = await firstValueFrom(this.snippetService.getSnippet(snippetId));
      if (gen !== this.detailGeneration) return;
      if (res?.snippet) {
        this.setSnippet(res.snippet, true);
      } else {
        this.error.set('Snippet not found');
      }
      this.loading.set(false);
    } catch {
      if (gen !== this.detailGeneration) return;
      this.error.set('Failed to load snippet');
      this.snippet.set(null);
      this.originalSnippet.set(null);
      this.loading.set(false);
    }
  }

  private async runListLoad(
    loader: () => Promise<SnippetListResponse | null | undefined>,
    errorMessage: string
  ) {
    const gen = ++this.listGeneration;
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await loader();
      if (gen !== this.listGeneration) return res ?? null;
      this.snippetList.set(res ?? null);
      this.loading.set(false);
      return res ?? null;
    } catch (err) {
      if (gen !== this.listGeneration) throw err;
      this.error.set(errorMessage);
      this.snippetList.set(null);
      this.loading.set(false);
      throw err;
    }
  }

  async loadUserSnippets(page: number, limit: number, q?: string) {
    return this.runListLoad(
      () => firstValueFrom(this.snippetService.getUserSnippets(page, limit, q)),
      'Failed to load user snippets'
    );
  }

  async loadPublicSnippets(page: number, limit: number, sort: SnippetSort = 'newest', q?: string) {
    return this.runListLoad(
      () => firstValueFrom(this.snippetService.getPublicSnippets(page, limit, sort, undefined, q)),
      'Failed to load public snippets'
    );
  }

  async loadFeedSnippets(page: number, limit: number, sort: SnippetSort = 'newest', q?: string) {
    return this.runListLoad(
      () => firstValueFrom(this.snippetService.getFeedSnippets(page, limit, sort, q)),
      'Failed to load feed'
    );
  }

  async loadUserPublicSnippets(userName: string, page: number, limit: number, q?: string) {
    return this.runListLoad(
      () => firstValueFrom(this.snippetService.getUserPublicSnippets(userName, page, limit, q)),
      'Failed to load user snippets'
    );
  }

  async loadFavorites(page: number, limit: number, q?: string) {
    const gen = ++this.favoritesGeneration;
    this.favoritesLoading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.favoriteService.getFavorites(page, limit, q));
      if (gen !== this.favoritesGeneration) return res ?? null;
      this.favoritesList.set(res ?? null);
      this.favoritesLoading.set(false);
      return res ?? null;
    } catch (err) {
      if (gen !== this.favoritesGeneration) throw err;
      this.error.set('Failed to load favorites');
      this.favoritesList.set(null);
      this.favoritesLoading.set(false);
      throw err;
    }
  }

  async searchSnippets(query: string, page: number, limit: number, sort: SnippetSort = 'newest') {
    return this.runListLoad(
      () => firstValueFrom(this.snippetService.searchSnippets(query, page, limit, sort)),
      'Failed to search snippets'
    );
  }

  async saveSnippet() {
    const s = this.snippet();
    if (!s) throw new Error('No snippet to save');
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.snippetService.saveSnippet(s));
      this.snippet.set(res.snippet);
      this.originalSnippet.set(JSON.parse(JSON.stringify(res.snippet)));
      return res;
    } catch (err) {
      this.error.set('Failed to save snippet');
      throw err;
    }
  }

  async deleteSnippet(snippetId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.snippetService.deleteSnippet(snippetId));
      this.snippetList.update(list => {
        if (!list) return list;
        return {
          ...list,
          snippets: list.snippets.filter(s => s.snippetId !== snippetId),
          totalCount: Math.max(0, (list.totalCount ?? 0) - 1),
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

  async favoriteSnippet(snippetId: string): Promise<FavoriteResponse | undefined> {
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.favoriteService.favoriteSnippet(snippetId)) as FavoriteResponse;
      if (response && typeof response.favoriteCount === 'number') {
        this.patchSnippetCounts(snippetId, {
          favoriteCount: response.favoriteCount,
          isFavorited: response.isFavorited,
        });
        if (!response.isFavorited) {
          this.favoritesList.update(list => {
            if (!list) return list;
            return {
              ...list,
              snippets: list.snippets.filter(item => item.snippetId !== snippetId),
              totalCount: Math.max(0, (list.totalCount ?? 0) - 1),
            };
          });
        } else {
          const existing = this.favoritesList()?.snippets.some(item => item.snippetId === snippetId);
          if (existing) {
            this.favoritesList.update(list => {
              if (!list) return list;
              return {
                ...list,
                snippets: list.snippets.map(item =>
                  item.snippetId === snippetId
                    ? { ...item, favoriteCount: response.favoriteCount, isFavorited: true }
                    : item
                ),
              };
            });
          } else {
            const row = this.resolveSnippetListItem(snippetId, response.favoriteCount);
            if (row) {
              this.favoritesList.update(list => {
                if (!list) {
                  return {
                    success: true,
                    snippets: [row],
                    totalCount: 1,
                  };
                }
                return {
                  ...list,
                  snippets: [row, ...list.snippets],
                  totalCount: (list.totalCount ?? list.snippets.length) + 1,
                };
              });
            } else {
              await this.loadFavorites(1, 6);
            }
          }
        }
      }
      return response;
    } catch (err) {
      this.error.set('Failed to favorite snippet');
      throw err;
    }
  }

  /** Build a favorites-list row from currently loaded list/detail state. */
  private resolveSnippetListItem(snippetId: string, favoriteCount: number): SnippetList | null {
    const fromList = this.snippetList()?.snippets.find(item => item.snippetId === snippetId);
    if (fromList) {
      return {
        ...fromList,
        favoriteCount,
        isFavorited: true,
      };
    }

    const detail = this.snippet();
    if (detail?.snippetId === snippetId) {
      return {
        snippetId: detail.snippetId,
        shortId: detail.shortId,
        name: detail.name,
        description: detail.description ?? null,
        tags: detail.tags?.length ? detail.tags : null,
        userName: detail.userName,
        displayName: detail.displayName,
        commentCount: detail.commentCount ?? 0,
        favoriteCount,
        viewCount: detail.viewCount ?? 0,
        isOwner: detail.isOwner,
        isFavorited: true,
      };
    }

    return null;
  }

  async forkSnippet(snippetId: string): Promise<SnippetResponse> {
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.snippetService.forkSnippet(snippetId));
      this.snippet.update(s =>
        s && s.snippetId === snippetId
          ? { ...s, forkCount: (s.forkCount ?? 0) + 1 }
          : s
      );
      return res;
    } catch (err) {
      this.error.set('Failed to fork snippet');
      throw err;
    }
  }

  async recordView(snippetId: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.snippetService.recordView(snippetId));
      if (res?.counted && typeof res.viewCount === 'number') {
        this.patchSnippetCounts(snippetId, { viewCount: res.viewCount });
      }
    } catch {
      // Non-blocking
    }
  }

  bumpCommentCount(snippetId: string, delta: number) {
    const apply = (count: number) => Math.max(0, count + delta);
    this.snippet.update(s =>
      s && s.snippetId === snippetId
        ? { ...s, commentCount: apply(s.commentCount ?? 0) }
        : s
    );
    const patchList = (list: SnippetListResponse | null) => {
      if (!list) return list;
      return {
        ...list,
        snippets: list.snippets.map(item =>
          item.snippetId === snippetId
            ? { ...item, commentCount: apply(item.commentCount ?? 0) }
            : item
        ),
      };
    };
    this.snippetList.update(patchList);
    this.favoritesList.update(patchList);
  }
  //#endregion API Methods

  isDirty = computed(() => {
    const s = this.snippet();
    const o = this.originalSnippet();
    if (!s || !o) return false;
    if (s.name !== o.name) return true;
    if (s.description !== o.description) return true;
    if (s.isPrivate !== o.isPrivate) return true;
    if (s.tags.length !== o.tags.length) return true;
    if (s.externalResources?.length !== o.externalResources?.length) return true;
    for (let i = 0; i < (s.externalResources?.length || 0); i++) {
      if (
        s.externalResources![i].resourceType !== o.externalResources![i].resourceType ||
        s.externalResources![i].url !== o.externalResources![i].url
      ) {
        return true;
      }
    }
    for (let i = 0; i < s.tags.length; i++) {
      if (s.tags[i] !== o.tags[i]) return true;
    }
    if (s.snippetFiles.length !== o.snippetFiles.length) return true;
    for (let i = 0; i < s.snippetFiles.length; i++) {
      if (s.snippetFiles[i].content !== o.snippetFiles[i].content) return true;
    }
    return false;
  });

  setSnippet(snippet: Snippet, updatePreview: boolean = false) {
    if (!snippet.tags) {
      snippet.tags = [];
    }
    this.snippet.set(snippet);
    this.originalSnippet.set(JSON.parse(JSON.stringify(snippet)));
    if (updatePreview) {
      this.previewUpdateType.set('full');
    }
  }

  //#region Update Methods
  updateSnippetFile(fileType: string, content: string) {
    this.previewUpdateType.set(
      fileType.toLowerCase() === 'html' || fileType.toLowerCase() === 'js' ? 'full' : 'partial'
    );
    this.snippet.update(s => {
      if (!s) return s;
      return {
        ...s,
        snippetFiles: s.snippetFiles.map(f =>
          f.fileType === fileType ? { ...f, content } : f
        ),
      };
    });
  }

  updateSnippetName(name: string) {
    this.previewUpdateType.set('full');
    this.snippet.update(s => (s ? { ...s, name } : s));
  }

  updateSnippetSettings(settings: {
    description: string;
    isPrivate: boolean;
    tags: string[];
    externalResources?: ExternalResource[];
  }) {
    this.previewUpdateType.set('full');
    this.snippet.update(s => {
      if (!s) return s;
      return {
        ...s,
        description: settings.description,
        isPrivate: settings.isPrivate,
        tags: settings.tags,
        externalResources: settings.externalResources ?? s.externalResources,
      };
    });
  }

  updateSnippetCounts(counts: {
    forkCount?: number;
    viewCount?: number;
    commentCount?: number;
    favoriteCount?: number;
  }) {
    const id = this.snippet()?.snippetId;
    if (!id) return;
    this.patchSnippetCounts(id, counts);
  }

  private patchSnippetCounts(
    snippetId: string,
    patch: {
      forkCount?: number;
      viewCount?: number;
      commentCount?: number;
      favoriteCount?: number;
      isFavorited?: boolean;
    }
  ) {
    this.snippet.update(s => {
      if (!s || s.snippetId !== snippetId) return s;
      return {
        ...s,
        ...(patch.forkCount !== undefined ? { forkCount: patch.forkCount } : {}),
        ...(patch.viewCount !== undefined ? { viewCount: patch.viewCount } : {}),
        ...(patch.commentCount !== undefined ? { commentCount: patch.commentCount } : {}),
        ...(patch.favoriteCount !== undefined ? { favoriteCount: patch.favoriteCount } : {}),
        ...(patch.isFavorited !== undefined ? { isFavorited: patch.isFavorited } : {}),
      };
    });

    this.snippetList.update(list => {
      if (!list) return list;
      return {
        ...list,
        snippets: list.snippets.map(item =>
          item.snippetId === snippetId ? this.applyListPatch(item, patch) : item
        ),
      };
    });

    this.favoritesList.update(list => {
      if (!list) return list;
      return {
        ...list,
        snippets: list.snippets.map(item =>
          item.snippetId === snippetId ? this.applyListPatch(item, patch) : item
        ),
      };
    });
  }

  private applyListPatch(
    item: SnippetList,
    patch: {
      viewCount?: number;
      commentCount?: number;
      favoriteCount?: number;
      isFavorited?: boolean;
    }
  ): SnippetList {
    return {
      ...item,
      ...(patch.viewCount !== undefined ? { viewCount: patch.viewCount } : {}),
      ...(patch.commentCount !== undefined ? { commentCount: patch.commentCount } : {}),
      ...(patch.favoriteCount !== undefined ? { favoriteCount: patch.favoriteCount } : {}),
      ...(patch.isFavorited !== undefined ? { isFavorited: patch.isFavorited } : {}),
    };
  }

  clearSnippet() {
    this.detailGeneration++;
    this.snippet.set(null);
    this.originalSnippet.set(null);
    this.previewUpdateType.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
  //#endregion Update Methods
}
