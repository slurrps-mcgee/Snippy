import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AssetListResponse, AssetResponse } from '@app/interfaces/asset.interface';
import { minioPolicy } from './resilience.service';
import { MinioStatusService } from '@app/services/ui/minio-status.service';

@Injectable({ providedIn: 'root' })
export class AssetApiService {
  private api = inject(ApiService);
  private minioStatus = inject(MinioStatusService);

  list(page = 1, limit = 50): Observable<AssetListResponse> {
    return this.minioStatus.latchOnError(
      this.api.request({
        path: '/assets',
        method: 'GET',
        params: { page, limit },
        policy: minioPolicy,
      })
    );
  }

  upload(file: File, subFolder = 'general'): Observable<AssetResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('subFolder', subFolder);
    return this.minioStatus.latchOnError(
      this.api.request<AssetResponse>({
        path: '/assets',
        method: 'POST',
        body: form,
        policy: minioPolicy,
      })
    );
  }

  delete(assetId: string): Observable<any> {
    return this.minioStatus.latchOnError(
      this.api.request({
        path: `/assets/${assetId}`,
        method: 'DELETE',
        policy: minioPolicy,
      })
    );
  }
}
