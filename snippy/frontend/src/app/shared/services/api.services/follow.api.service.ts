import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface FollowResponse {
  success: boolean;
  message?: string;
  isFollowing?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FollowApiService {
  private api = inject(ApiService);

  follow(userName: string): Observable<FollowResponse> {
    return this.api.request({
      path: `/users/${encodeURIComponent(userName)}/follow`,
      method: 'POST',
    });
  }

  unfollow(userName: string): Observable<FollowResponse> {
    return this.api.request({
      path: `/users/${encodeURIComponent(userName)}/follow`,
      method: 'DELETE',
    });
  }
}
