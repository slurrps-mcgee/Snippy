import { SnackbarService } from '@app/services/ui/snackbar.service';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { NavigationService } from '@app/services/ui/navigation.service';
import { User } from '@app/interfaces/user.interface';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SnippetSaveUIService {
  private navigation = inject(NavigationService);
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
          this.navigation.toSnippet(response.snippet.shortId, currentUser.userName);
        }
      }
    } catch (err) {
      this.snackbarService.error('Failed to save snippet');
    }
  }
}
