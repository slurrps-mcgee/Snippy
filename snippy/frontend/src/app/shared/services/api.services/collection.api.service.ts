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

  getMyCollections(
    page = 1,
    limit = 20,
    snippetId?: string,
    q?: string
  ): Observable<CollectionListResponse> {
    return this.api.request({
      path: '/collections/me',
      method: 'GET',
      params: {
        page,
        limit,
        ...(snippetId ? { snippetId } : {}),
        ...(q ? { q } : {}),
      },
    });
  }

  getUserCollections(
    userName: string,
    page = 1,
    limit = 20,
    q?: string
  ): Observable<CollectionListResponse> {
    return this.api.request({
      path: `/collections/user/${encodeURIComponent(userName)}`,
      method: 'GET',
      params: { page, limit, ...(q ? { q } : {}) },
    });
  }

  getCollection(shortId: string, q?: string): Observable<CollectionResponse> {
    return this.api.request({
      path: `/collections/${shortId}`,
      method: 'GET',
      params: { ...(q ? { q } : {}) },
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
}
