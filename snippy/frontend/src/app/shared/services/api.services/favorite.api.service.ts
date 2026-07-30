import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { FavoriteResponse } from '../../interfaces/favoriteResponse.interface';
import { SnippetListResponse } from '../../interfaces/snippetListResponse.interface';
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

  isFavorited(snippetId: string): Observable<{ success: boolean; isFavorited: boolean }> {
    return this.apiService.request({
      path: `/favorites/${snippetId}`,
      method: 'GET',
    });
  }

  getFavorites(page = 1, limit = 20): Observable<SnippetListResponse> {
    return this.apiService.request({
      path: '/favorites',
      method: 'GET',
      params: { page, limit },
    });
  }
}
