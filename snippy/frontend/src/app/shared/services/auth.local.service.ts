import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable, of, switchMap, tap, filter, take, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserResponse } from '../interfaces/userResponse.interface';
import { User } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthLocalService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private auth0Service: AuthService, private apiService: ApiService) {
    
    // When Auth0 logs out → clear state
    this.auth0Service.isAuthenticated$
      .pipe(
        filter(isAuth => !isAuth),
        tap(() => this.clearUserState())
      )
      .subscribe();

    // When Auth0 logs in → sync or create backend user
    this.auth0Service.isAuthenticated$
      .pipe(
        filter(Boolean),
        switchMap(() => this.auth0Service.user$.pipe(take(1))),
        switchMap((profile: any) => this.syncBackendUser(profile))
      )
      .subscribe();
  }

  /** Save user to subject */
  private setUser(user: User) {
    this.userSubject.next(user);
  }

  /** Clear user state */
  private clearUserState() {
    this.userSubject.next(null);
  }

  /** Login + Create/Load backend user */
  private syncBackendUser(profile: any) {
    const payload = {
      name: profile?.name,
      pictureUrl: profile?.picture
    };

    return this.apiService.request<UserResponse>({
      path: '/users',
      method: 'POST',
      body: payload
    }).pipe(
      tap(res => {
        const user = res?.user ?? res;
        if (user) this.setUser(user);
      }),
      catchError((err: HttpErrorResponse) => {
        console.warn('User sync failed', err);
        return of(null);
      })
    );
  }

  /** Manual logout trigger */
  public logout() {
    this.clearUserState();
    this.auth0Service.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  /** Returns current user synchronously */
  public getCurrentUserSync() {
    return this.userSubject.value;
  }

  /** Returns authentication observable */
  public isAuthenticated$(): Observable<boolean> {
    return this.auth0Service.isAuthenticated$;
  }

  /** Refresh user from backend */
  public refreshUserFromBackend(): Observable<UserResponse | null> {
    return this.apiService.request<UserResponse>({
      method: 'GET',
      path: '/users/me'
    }).pipe(
      tap(res => {
        if (res?.user) this.setUser(res.user);
      }),
      catchError(() => {
        console.warn('User refresh failed');
        return of(null);
      })
    );
  }
}