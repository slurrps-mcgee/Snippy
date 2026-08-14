import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Snippet } from '@app/interfaces/snippet.interface';
import { SnippetResponse } from '@app/interfaces/snippetResponse.interface';
import { SnippetListResponse } from '@app/interfaces/snippetListResponse.interface';
import { minioPolicy } from './resilience.service';
import { MinioStatusService } from '@app/services/ui/minio-status.service';

export type SnippetSort = 'newest' | 'views' | 'favorites' | 'forks';

@Injectable({ providedIn: 'root' })
export class SnippetAPIService {
  private apiService = inject(ApiService);
  private minioStatus = inject(MinioStatusService);

  getSnippet(shortId: string): Observable<SnippetResponse> {
    return this.apiService.request<SnippetResponse>({
      path: `/snippets/${shortId}`,
      method: 'GET'
    });
  }

  getUserSnippets(page: number, limit: number, q?: string): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/me`,
      method: 'GET',
      params: { page, limit, ...(q ? { q } : {}) }
    });
  }

  getPublicSnippets(
    page: number,
    limit: number,
    sort: SnippetSort = 'newest',
    tag?: string,
    q?: string
  ): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/public`,
      method: 'GET',
      params: { page, limit, sort, ...(tag ? { tag } : {}), ...(q ? { q } : {}) }
    });
  }

  getFeedSnippets(
    page: number,
    limit: number,
    sort: SnippetSort = 'newest',
    q?: string
  ): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/feed`,
      method: 'GET',
      params: { page, limit, sort, ...(q ? { q } : {}) }
    });
  }

  getUserPublicSnippets(
    userName: string,
    page: number,
    limit: number,
    q?: string
  ): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/user/${encodeURIComponent(userName)}`,
      method: 'GET',
      params: { page, limit, ...(q ? { q } : {}) }
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
          cdnResources: snippet.cdnResources ?? []
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
        cdnResources: snippet.cdnResources ?? []
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

  uploadSnapshot(snippetId: string, blob: Blob): Observable<SnippetResponse> {
    const form = new FormData();
    form.append('file', blob, 'snapshot.jpg');
    return this.minioStatus.latchOnError(
      this.apiService.request<SnippetResponse>({
        path: `/snippets/${snippetId}/snapshot`,
        method: 'POST',
        body: form,
        policy: minioPolicy,
      })
    );
  }

  deleteSnippet(snippetId: string): Observable<any> {
    return this.apiService.request<any>({
      path: `/snippets/${snippetId}`,
      method: 'DELETE'
    });
  }
}
