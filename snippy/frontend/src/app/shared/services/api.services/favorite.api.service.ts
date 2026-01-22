import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { FavoriteResponse } from '../../interfaces/favoriteResponse.interface';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class FavoriteService {
    constructor(private apiService: ApiService) { }

    // Favorite a snippet by its snippetId will return the favorite count
    favoriteSnippet(snippetId: string): Observable<FavoriteResponse> {
        return this.apiService.request<FavoriteResponse>({
            path: `/favorites/${snippetId}`,
            method: 'POST'
        });
    }
}