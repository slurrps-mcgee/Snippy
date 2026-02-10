import { Router } from "@angular/router";
import { SnackbarService } from "../component.services/snackbar.service";
import { SnippetStoreService } from "../store.services/snippet.store.service";
import { User } from "../../interfaces/user.interface";
import { Injectable, inject } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SnippetSaveUIService {
  private router = inject(Router);
  private snackbarService = inject(SnackbarService);

  async saveSnippetWithUI(snippetStoreService: SnippetStoreService, userGetter: () => User | null) {
    const isNew = !snippetStoreService.snippet()?.shortId;
    if (!snippetStoreService.isDirty()) return;
    try {
      const response = await snippetStoreService.saveSnippet();
      this.snackbarService.success('Snippet saved');
      if (isNew && response.snippet?.shortId) {
        const currentUser = userGetter();
        if (currentUser?.userName) {
          this.router.navigate([currentUser.userName, 'snippet', response.snippet.shortId]);
        }
      }
    } catch (err) {
      this.snackbarService.error('Failed to save snippet');
    }
  }
}