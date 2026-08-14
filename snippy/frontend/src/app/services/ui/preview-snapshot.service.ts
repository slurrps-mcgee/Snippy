import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SnippetAPIService } from '@app/services/api/snippet.api.service';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { MinioStatusService } from '@app/services/ui/minio-status.service';

@Injectable({ providedIn: 'root' })
export class PreviewSnapshotService {
  private snippetApi = inject(SnippetAPIService);
  private snippetStore = inject(SnippetStoreService);
  private minioStatus = inject(MinioStatusService);

  get enabled(): boolean {
    return this.minioStatus.enabled();
  }

  private captureFn: (() => Promise<Blob | null>) | null = null;

  register(captureFn: () => Promise<Blob | null>): void {
    this.captureFn = captureFn;
  }

  unregister(): void {
    this.captureFn = null;
  }

  async captureAndUpload(snippetId: string | null | undefined): Promise<void> {
    if (!this.enabled || !snippetId || !this.captureFn) return;
    try {
      const blob = await this.captureFn();
      if (!blob) return;
      const res = await firstValueFrom(this.snippetApi.uploadSnapshot(snippetId, blob));
      if (res?.snippet) {
        this.snippetStore.applySnapshotMeta(
          snippetId,
          res.snippet.snapshotUrl,
          res.snippet.updatedAt
        );
      }
    } catch (err) {
      console.warn('Snippet snapshot skipped', err);
    }
  }
}
