import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../../interfaces/user.interface';

export interface UsersListResponse {
  success: boolean;
  users: User[];
  totalCount: number;
}

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

  getFollowers(userName: string, page = 1, limit = 20): Observable<UsersListResponse> {
    return this.api.request({
      path: `/users/${encodeURIComponent(userName)}/followers`,
      method: 'GET',
      params: { page, limit },
    });
  }

  getFollowing(userName: string, page = 1, limit = 20): Observable<UsersListResponse> {
    return this.api.request({
      path: `/users/${encodeURIComponent(userName)}/following`,
      method: 'GET',
      params: { page, limit },
    });
  }
}
