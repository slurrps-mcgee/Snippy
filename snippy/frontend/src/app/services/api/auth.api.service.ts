
import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { UserResponse } from '@app/interfaces/userResponse.interface';

@Injectable({ providedIn: 'root' })
export class AuthAPIService {
	private apiService = inject(ApiService);

	/** Create or load backend user */
	syncBackendUser(profile: any): Observable<UserResponse> {
		const payload = {
			name: profile?.name,
			pictureUrl: profile?.picture
		};
		return this.apiService.request<UserResponse>({
			path: '/users',
			method: 'POST',
			body: payload
		});
	}

	/** Get current user from backend */
	getCurrentUser(): Observable<UserResponse> {
		return this.apiService.request<UserResponse>({
			method: 'GET',
			path: '/users/me'
		});
	}
}
