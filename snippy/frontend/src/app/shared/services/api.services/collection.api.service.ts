import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Collection,
  CollectionListResponse,
  CollectionResponse,
} from '../../interfaces/collection.interface';

@Injectable({ providedIn: 'root' })
export class CollectionApiService {
  private api = inject(ApiService);

  getMyCollections(page = 1, limit = 20, snippetId?: string): Observable<CollectionListResponse> {
    return this.api.request({
      path: '/collections/me',
      method: 'GET',
      params: {
        page,
        limit,
        ...(snippetId ? { snippetId } : {}),
      },
    });
  }

  getUserCollections(userName: string, page = 1, limit = 20): Observable<CollectionListResponse> {
    return this.api.request({
      path: `/collections/user/${encodeURIComponent(userName)}`,
      method: 'GET',
      params: { page, limit },
    });
  }

  getCollection(shortId: string): Observable<CollectionResponse> {
    return this.api.request({
      path: `/collections/${shortId}`,
      method: 'GET',
    });
  }

  createCollection(body: {
    name: string;
    description?: string | null;
    isPrivate?: boolean;
  }): Observable<CollectionResponse> {
    return this.api.request({
      path: '/collections',
      method: 'POST',
      body,
    });
  }

  updateCollection(
    collectionId: string,
    body: { name?: string; description?: string | null; isPrivate?: boolean }
  ): Observable<CollectionResponse> {
    return this.api.request({
      path: `/collections/${collectionId}`,
      method: 'PUT',
      body,
    });
  }

  deleteCollection(collectionId: string): Observable<{ success: boolean; message?: string }> {
    return this.api.request({
      path: `/collections/${collectionId}`,
      method: 'DELETE',
    });
  }

  addSnippet(collectionId: string, snippetId: string): Observable<CollectionResponse> {
    return this.api.request({
      path: `/collections/${collectionId}/snippets`,
      method: 'POST',
      body: { snippetId },
    });
  }

  removeSnippet(collectionId: string, snippetId: string): Observable<{ success: boolean; message?: string }> {
    return this.api.request({
      path: `/collections/${collectionId}/snippets/${snippetId}`,
      method: 'DELETE',
    });
  }

  reorderSnippets(collectionId: string, snippetIds: string[]): Observable<{ success: boolean; message?: string }> {
    return this.api.request({
      path: `/collections/${collectionId}/snippets/order`,
      method: 'PUT',
      body: { snippetIds },
    });
  }
}
