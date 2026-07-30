import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AssetListResponse, AssetResponse } from '@app/interfaces/asset.interface';
import { getRuntimeEnv } from '@app/config/runtime-env';

@Injectable({ providedIn: 'root' })
export class ResourceApiService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private apiBase = getRuntimeEnv().api_base;

  list(page = 1, limit = 50): Observable<AssetListResponse> {
    return this.api.request({
      path: '/resources',
      method: 'GET',
      params: { page, limit },
    });
  }

  /** Multipart upload — bypasses JSON ApiService helper */
  upload(file: File, subFolder = 'general'): Observable<AssetResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('subFolder', subFolder);
    return this.http.post<AssetResponse>(`${this.apiBase}/resources`, form);
  }

  delete(assetId: string): Observable<any> {
    return this.api.request({
      path: `/resources/${assetId}`,
      method: 'DELETE',
    });
  }
}
