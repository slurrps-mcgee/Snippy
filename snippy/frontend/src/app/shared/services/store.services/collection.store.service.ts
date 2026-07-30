import { Injectable, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CollectionApiService } from '../api.services/collection.api.service';
import { Collection } from '../../interfaces/collection.interface';

@Injectable({ providedIn: 'root' })
export class CollectionStoreService {
  collections = signal<Collection[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  activeCollection = signal<Collection | null>(null);

  private api = inject(CollectionApiService);

  async loadMine(page = 1, limit = 50, snippetId?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.getMyCollections(page, limit, snippetId));
      this.collections.set(res.collections ?? []);
      this.totalCount.set(res.totalCount ?? 0);
    } catch {
      this.error.set('Failed to load collections');
      this.collections.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadUser(userName: string, page = 1, limit = 50) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.getUserCollections(userName, page, limit));
      this.collections.set(res.collections ?? []);
      this.totalCount.set(res.totalCount ?? 0);
    } catch {
      this.error.set('Failed to load collections');
      this.collections.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadOne(shortId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.getCollection(shortId));
      this.activeCollection.set(res.collection ?? null);
      return res.collection;
    } catch {
      this.error.set('Failed to load collection');
      this.activeCollection.set(null);
      throw new Error('Failed to load collection');
    } finally {
      this.loading.set(false);
    }
  }

  async create(body: { name: string; description?: string | null; isPrivate?: boolean }) {
    const res = await firstValueFrom(this.api.createCollection(body));
    if (res.collection) {
      const created = {
        ...res.collection,
        snippetCount: res.collection.snippetCount ?? 0,
      };
      this.collections.update(list => [created, ...list]);
      this.totalCount.update(n => n + 1);
      return created;
    }
    return res.collection;
  }

  async delete(collectionId: string) {
    await firstValueFrom(this.api.deleteCollection(collectionId));
    this.collections.update(list => list.filter(c => c.collectionId !== collectionId));
    this.totalCount.update(n => Math.max(0, n - 1));
    if (this.activeCollection()?.collectionId === collectionId) {
      this.activeCollection.set(null);
    }
  }

  async addSnippet(collectionId: string, snippetId: string) {
    const res = await firstValueFrom(this.api.addSnippet(collectionId, snippetId));
    const updated = res.collection;

    this.collections.update(list =>
      list.map(c => {
        if (c.collectionId !== collectionId) return c;
        return {
          ...c,
          snippetCount: updated?.snippetCount ?? (c.snippetCount ?? 0) + 1,
          containsSnippet: true,
        };
      })
    );

    this.activeCollection.update(active => {
      if (!active || active.collectionId !== collectionId) return active;
      if (updated) {
        return {
          ...updated,
          snippets: updated.snippets ?? active.snippets,
          snippetCount: updated.snippetCount ?? (active.snippetCount ?? 0) + 1,
        };
      }
      return {
        ...active,
        snippetCount: (active.snippetCount ?? 0) + 1,
      };
    });

    return res;
  }

  async removeSnippet(collectionId: string, snippetId: string) {
    await firstValueFrom(this.api.removeSnippet(collectionId, snippetId));

    this.collections.update(list =>
      list.map(c => {
        if (c.collectionId !== collectionId) return c;
        return {
          ...c,
          snippetCount: Math.max(0, (c.snippetCount ?? 0) - 1),
          containsSnippet: c.containsSnippet ? false : c.containsSnippet,
        };
      })
    );

    this.activeCollection.update(active => {
      if (!active || active.collectionId !== collectionId) return active;
      const snippets = (active.snippets ?? []).filter(s => s.snippetId !== snippetId);
      return {
        ...active,
        snippets,
        snippetCount: snippets.length,
      };
    });
  }
}
