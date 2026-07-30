import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Snippet } from '../../interfaces/snippet.interface';
import { SnippetResponse } from '../../interfaces/snippetResponse.interface';
import { SnippetListResponse } from '../../interfaces/snippetListResponse.interface';

export type SnippetSort = 'newest' | 'views' | 'favorites' | 'forks';

@Injectable({ providedIn: 'root' })
export class SnippetAPIService {
  private apiService = inject(ApiService);

  getSnippet(shortId: string): Observable<SnippetResponse> {
    return this.apiService.request<SnippetResponse>({
      path: `/snippets/${shortId}`,
      method: 'GET'
    });
  }

  getUserSnippets(page: number, limit: number): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/me`,
      method: 'GET',
      params: { page, limit }
    });
  }

  getPublicSnippets(
    page: number,
    limit: number,
    sort: SnippetSort = 'newest',
    tag?: string
  ): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/public`,
      method: 'GET',
      params: { page, limit, sort, ...(tag ? { tag } : {}) }
    });
  }

  getFeedSnippets(
    page: number,
    limit: number,
    sort: SnippetSort = 'newest'
  ): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/feed`,
      method: 'GET',
      params: { page, limit, sort }
    });
  }

  getUserPublicSnippets(
    userName: string,
    page: number,
    limit: number
  ): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/user/${encodeURIComponent(userName)}`,
      method: 'GET',
      params: { page, limit }
    });
  }

  searchSnippets(
    query: string,
    page: number,
    limit: number,
    sort: SnippetSort = 'newest',
    tag?: string
  ): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/search`,
      method: 'GET',
      params: { q: query, page, limit, sort, ...(tag ? { tag } : {}) }
    });
  }

  saveSnippet(snippet: Snippet): Observable<SnippetResponse> {
    if (!snippet) throw new Error('No snippet to save');
    if (!snippet.snippetId) {
      return this.apiService.request<SnippetResponse>({
        path: `/snippets`,
        method: 'POST',
        body: {
          name: snippet.name,
          description: snippet.description,
          tags: snippet.tags,
          isPrivate: snippet.isPrivate,
          snippetFiles: snippet.snippetFiles,
          externalResources: snippet.externalResources ?? []
        }
      });
    }
    return this.apiService.request<SnippetResponse>({
      path: `/snippets/${snippet.snippetId}`,
      method: 'PUT',
      body: {
        name: snippet.name,
        description: snippet.description,
        tags: snippet.tags,
        isPrivate: snippet.isPrivate,
        snippetFiles: snippet.snippetFiles,
        externalResources: snippet.externalResources ?? []
      }
    });
  }

  forkSnippet(snippetId: string): Observable<SnippetResponse> {
    return this.apiService.request<SnippetResponse>({
      path: `/snippets/fork/${snippetId}`,
      method: 'POST'
    });
  }

  recordView(snippetId: string): Observable<{ success: boolean; viewCount: number; counted: boolean }> {
    return this.apiService.request({
      path: `/snippets/${snippetId}/view`,
      method: 'POST'
    });
  }

  deleteSnippet(snippetId: string): Observable<any> {
    return this.apiService.request<any>({
      path: `/snippets/${snippetId}`,
      method: 'DELETE'
    });
  }
}
