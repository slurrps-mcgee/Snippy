import { SnackbarService } from '@app/services/ui/snackbar.service';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { NavigationService } from '@app/services/ui/navigation.service';
import { PreviewSnapshotService } from '@app/services/ui/preview-snapshot.service';
import { MinioStatusService } from '@app/services/ui/minio-status.service';
import { DraftAutosaveService, DRAFT_TRY_KEY } from '@app/services/ui/draft-autosave.service';
import { User } from '@app/api/generated/models/user';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SnippetSaveUIService {
  private navigation = inject(NavigationService);
  private snackbarService = inject(SnackbarService);
  private previewSnapshot = inject(PreviewSnapshotService);
  private minioStatus = inject(MinioStatusService);
  private drafts = inject(DraftAutosaveService);

  async saveSnippetWithUI(snippetStoreService: SnippetStoreService, userGetter: () => User | null) {
    const isNew = !snippetStoreService.snippet()?.shortId;
    if (!snippetStoreService.isDirty()) return;
    try {
      const response = await snippetStoreService.saveSnippet();
      const saved = snippetStoreService.snippet();
      this.drafts.remove(this.drafts.keyFor({ guest: false, shortId: null }));
      if (saved?.shortId) {
        this.drafts.remove(this.drafts.keyFor({ guest: false, shortId: saved.shortId }));
      }
      this.drafts.remove(DRAFT_TRY_KEY);
      if (this.minioStatus.enabled() && response.snippet?.snippetId) {
        await this.previewSnapshot.captureAndUpload(response.snippet.snippetId);
      }
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
