import { Injectable, inject, DestroyRef } from '@angular/core';
import { Snippet } from '../interfaces/snippet.interface';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';
import { SnippetResponse } from '../interfaces/snippetResponse.interface';
import { SnippetListResponse } from '../interfaces/snippetListResponse.interface';
import { SnippetStateService } from './snippet-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class SnippetService {
  private destroyRef = inject(DestroyRef);
  private snippetStateService = inject(SnippetStateService);

  constructor(private apiService: ApiService) { }

  // Fetch a snippet by its snippetId
  getSnippet(snippetId: string): Observable<SnippetResponse> {
    return this.apiService.request<SnippetResponse>({
      path: `/snippets/${snippetId}`,
      method: 'GET'
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap({
        next: (response) => {
          this.snippetStateService.setSnippet(response.snippet, true);
        },
        error: (error) => {
          console.error('Failed to load snippet:', error);
        }
      })
    );
  }

  // Get snippets belonging to the authenticated user
  getUserSnippets(page: number, limit: number): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/me`,
      method: 'GET',
      params: { page, limit }
    });
  }

  // Get public snippets with page and limit
  getPublicSnippets(page: number, limit: number): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/public`,
      method: 'GET',
      params: { page, limit }
    });
  }

  // Search snippets by query with page and limit
  searchSnippets(query: string, page: number, limit: number): Observable<SnippetListResponse> {
    return this.apiService.request<SnippetListResponse>({
      path: `/snippets/search`,
      method: 'GET',
      params: { query, page, limit }
    });
  }

  // Save the current snippet (create or update)
  saveSnippet(): Observable<SnippetResponse> {
    const s = this.snippetStateService.snippet();
    if (!s) throw new Error('No snippet to save');

    if (!s.snippetId) {
      // New snippet - create
      return this.apiService.request<SnippetResponse>({
        path: `/snippets`,
        method: 'POST',
        body: {
          name: s.name,
          description: s.description,
          tags: s.tags,
          isPrivate: s.isPrivate,
          snippetFiles: s.snippetFiles
        }
      }).pipe(
        tap((response) => {
          // Update the snippet with the returned data (including snippetId)
          this.snippetStateService.setSnippet(response.snippet, true);
        })
      );
    }
    else {
      // Existing snippet - update
      return this.apiService.request<SnippetResponse>({
        path: `/snippets/${s.snippetId}`,
        method: 'PUT',
        body: {
          name: s.name,
          description: s.description,
          tags: s.tags,
          isPrivate: s.isPrivate,
          snippetFiles: s.snippetFiles
        }
      }).pipe(
        tap((response) => {
          this.snippetStateService.setSnippet(response.snippet, false);
        })
      );
    }
  }

  // Delete a snippet by its snippetId
  deleteSnippet(snippetId: string): Observable<any> {
    return this.apiService.request<any>({ 
      path: `/snippets/${snippetId}`,
      method: 'DELETE'
    });
  }
}