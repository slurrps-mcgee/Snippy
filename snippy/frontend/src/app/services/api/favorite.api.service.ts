import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { FavoriteResponse } from '@app/interfaces/favoriteResponse.interface';
import { SnippetListResponse } from '@app/interfaces/snippetListResponse.interface';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private apiService = inject(ApiService);

  favoriteSnippet(snippetId: string): Observable<FavoriteResponse> {
    return this.apiService.request<FavoriteResponse>({
      path: `/favorites/${snippetId}`,
      method: 'POST'
    });
  }

  getFavorites(page = 1, limit = 20, q?: string): Observable<SnippetListResponse> {
    return this.apiService.request({
      path: '/favorites',
      method: 'GET',
      params: { page, limit, ...(q ? { q } : {}) },
    });
  }
}
