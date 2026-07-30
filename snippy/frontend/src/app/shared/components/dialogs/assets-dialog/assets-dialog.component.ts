import { Component, ElementRef, OnInit, ViewChild, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResourceApiService } from '../../../services/api.services/resource.api.service';
import { SnackbarService } from '../../../services/component.services/snackbar.service';
import { getRuntimeEnv } from '../../../../core/config/runtime-env';
import { Assets } from '../../../interfaces/asset.interface';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-assets-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './assets-dialog.component.html',
  styleUrl: './assets-dialog.component.scss',
})
export class AssetsDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AssetsDialogComponent>);

  private resourceApiService = inject(ResourceApiService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly minioEnabled = getRuntimeEnv().minio_enabled;

  assets = signal<Assets[]>([]);
  loading = signal(false);
  uploading = signal(false);
  deletingId = signal<string | null>(null);

  ngOnInit(): void {
    if (this.minioEnabled) {
      this.loadAssets();
    }
  }

  async loadAssets() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.resourceApiService.list());
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
      const res = await firstValueFrom(this.resourceApiService.upload(file));
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

  deleteAsset(asset: Assets) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Asset',
        message: `Are you sure you want to delete "${asset.fileName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (result) => {
      if (!result) return;
      this.deletingId.set(asset.assetId);
      try {
        await firstValueFrom(this.resourceApiService.delete(asset.assetId));
        this.assets.update(list => list.filter(a => a.assetId !== asset.assetId));
        this.snackbarService.success('Asset deleted');
      } catch {
        this.snackbarService.error('Failed to delete asset');
      } finally {
        this.deletingId.set(null);
      }
    });
  }

  async copyUrl(asset: Assets) {
    const fullUrl = this.toAbsoluteUrl(asset.url);
    try {
      await navigator.clipboard.writeText(fullUrl);
      this.snackbarService.success('URL copied to clipboard');
    } catch {
      this.snackbarService.error('Failed to copy URL');
    }
  }

  isImage(asset: Assets): boolean {
    return asset.fileType?.startsWith('image/');
  }

  toAbsoluteUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  close() {
    this.dialogRef.close();
  }
}
