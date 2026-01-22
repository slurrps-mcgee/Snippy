import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class CommentService {
    private destroyRef = inject(DestroyRef);

}