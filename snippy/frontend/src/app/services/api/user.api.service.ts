import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { UserResponse } from '@app/interfaces/userResponse.interface';
import { User } from '@app/interfaces/user.interface';
import { getRuntimeEnv } from '@app/config/runtime-env';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private readonly apiBase = getRuntimeEnv().api_base;

  getByUserName(userName: string): Observable<UserResponse> {
    return this.api.request({
      path: `/users/${encodeURIComponent(userName)}`,
      method: 'GET',
    });
  }

  updateProfile(body: Partial<Pick<User, 'userName' | 'displayName' | 'bio' | 'pictureUrl' | 'isPrivate' | 'editorPreferences'>>): Observable<UserResponse> {
    return this.api.request({
      path: '/users',
      method: 'PUT',
      body,
    });
  }

  checkUsername(userName: string): Observable<{ success: boolean; available: boolean }> {
    return this.api.request({
      path: `/users/check-username/${encodeURIComponent(userName)}`,
      method: 'GET',
    });
  }

  /** Backend returns 204 No Content */
  deleteAccount(): Observable<void> {
    return this.http
      .delete(`${this.apiBase}/users`, { responseType: 'text' })
      .pipe(map(() => undefined));
  }
}
