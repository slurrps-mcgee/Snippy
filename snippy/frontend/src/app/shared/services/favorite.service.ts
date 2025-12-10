import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class FavoriteService {
    private destroyRef = inject(DestroyRef);

}