import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { ApiService } from './api.service';
import { pipe } from 'rxjs/internal/util/pipe';

@Injectable({ providedIn: 'root' })

export class FavoriteService {
    private destroyRef = inject(DestroyRef);

    constructor(private apiService: ApiService) { }

    // Favorite a snippet by its snippetId will return the favorite count
    favoriteSnippet(snippetId: string) {
        return this.apiService.request<void>({
            path: `/favorites/${snippetId}`,
            method: 'POST'
        }).pipe();
    }
}