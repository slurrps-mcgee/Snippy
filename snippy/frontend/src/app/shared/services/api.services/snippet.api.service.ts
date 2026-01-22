import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Snippet } from '../../interfaces/snippet.interface';
import { SnippetResponse } from '../../interfaces/snippetResponse.interface';
import { SnippetListResponse } from '../../interfaces/snippetListResponse.interface';

@Injectable({ providedIn: 'root' })
export class SnippetAPIService {
  constructor(private apiService: ApiService) { }

  // API-only methods
  getSnippet(snippetId: string): Observable<SnippetResponse> {
    return this.apiService.request<SnippetResponse>({
      path: `/snippets/${snippetId}`,
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

  getPublicSnippets(page: number, limit: number): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/public`,
      method: 'GET',
      params: { page, limit }
    });
  }

  searchSnippets(query: string, page: number, limit: number): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/search`,
      method: 'GET',
      params: { query, page, limit }
    });
  }

  saveSnippet(snippet: Snippet): Observable<SnippetResponse> {
    if (!snippet) throw new Error('No snippet to save');
    if (!snippet.snippetId) {
      // New snippet - create
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
    } else {
      // Existing snippet - update
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
  }

  deleteSnippet(snippetId: string): Observable<any> {
    return this.apiService.request<any>({
      path: `/snippets/${snippetId}`,
      method: 'DELETE'
    });
  }
}