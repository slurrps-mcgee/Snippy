import { SnackbarService } from '@app/services/ui/snackbar.service';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { NavigationService } from '@app/services/ui/navigation.service';
import { PreviewSnapshotService } from '@app/services/ui/preview-snapshot.service';
import { MinioStatusService } from '@app/services/ui/minio-status.service';
import { User } from '@app/api/generated/models/user';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SnippetSaveUIService {
  private navigation = inject(NavigationService);
  private snackbarService = inject(SnackbarService);
  private previewSnapshot = inject(PreviewSnapshotService);
  private minioStatus = inject(MinioStatusService);

  async saveSnippetWithUI(snippetStoreService: SnippetStoreService, userGetter: () => User | null) {
    const isNew = !snippetStoreService.snippet()?.shortId;
    if (!snippetStoreService.isDirty()) return;
    try {
      const response = await snippetStoreService.saveSnippet();
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
