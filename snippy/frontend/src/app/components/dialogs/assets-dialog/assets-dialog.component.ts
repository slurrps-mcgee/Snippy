import { Component, ElementRef, OnInit, ViewChild, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Api } from '@app/api/generated/api';
import { deleteAsset, listAssets, uploadAsset } from '@app/api/generated/functions';
import { SnackbarService } from '@app/services/ui/snackbar.service';
import { DialogService } from '@app/services/ui/dialog.service';
import { Asset } from '@app/api/generated/models/asset';
import { MinioStatusService } from '@app/services/ui/minio-status.service';

@Component({
  selector: 'app-assets-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
],
  templateUrl: './assets-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './assets-dialog.component.scss',
})
export class AssetsDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AssetsDialogComponent>);

  private api = inject(Api);
  private snackbarService = inject(SnackbarService);
  private dialogService = inject(DialogService);
  readonly minioEnabled = inject(MinioStatusService).enabled;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  assets = signal<Asset[]>([]);
  loading = signal(false);
  uploading = signal(false);
  deletingId = signal<string | null>(null);

  ngOnInit(): void {
    if (this.minioEnabled()) {
      this.loadAssets();
    }
  }

  async loadAssets() {
    this.loading.set(true);
    try {
      const res = await this.api.invoke(listAssets);
      this.assets.set(res.assets ?? []);
    } catch {
      this.snackbarService.error('Failed to load assets');
    } finally {
      this.loading.set(false);
    }
  }

  triggerUpload() {
    this.fileInput?.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    try {
      const res = await this.api.invoke(uploadAsset, { body: { file, subFolder: 'general' } });
      if (res.asset) {
        this.assets.update(list => [res.asset!, ...list.filter(a => a.assetId !== res.asset!.assetId)]);
      }
      this.snackbarService.success('File uploaded successfully');
    } catch {
      this.snackbarService.error('Failed to upload file');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  deleteAsset(asset: Asset) {
    return this.dialogService.confirmAndRun({
      confirm: {
        title: 'Delete Asset',
        message: `Are you sure you want to delete "${asset.fileName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      action: async () => {
        this.deletingId.set(asset.assetId ?? null);
        try {
          if (!asset.assetId) throw new Error('Missing asset id');
          await this.api.invoke(deleteAsset, { assetId: asset.assetId });
          this.assets.update(list => list.filter(a => a.assetId !== asset.assetId));
        } finally {
          this.deletingId.set(null);
        }
      },
      success: 'Asset deleted',
      error: 'Failed to delete asset',
    });
  }

  async copyUrl(asset: Asset) {
    if (!asset.url) return;
    const fullUrl = this.toAbsoluteUrl(asset.url);
    try {
      await navigator.clipboard.writeText(fullUrl);
      this.snackbarService.success('URL copied to clipboard');
    } catch {
      this.snackbarService.error('Failed to copy URL');
    }
  }

  isImage(asset: Asset): boolean {
    return !!asset.fileType?.startsWith('image/');
  }

  toAbsoluteUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  close() {
    this.dialogRef.close();
  }
}
