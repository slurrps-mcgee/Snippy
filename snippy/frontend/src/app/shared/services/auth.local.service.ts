import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable, of, switchMap, tap, filter, take, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { USER_STORAGE_KEY } from '../helpers/constants';
import { HttpErrorResponse } from '@angular/common/http';
import { UserResponse } from '../interfaces/userResponse.interface';
import { User } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthLocalService {
  private userSubject = new BehaviorSubject<User | null>(this.loadStoredUser());
  public user$ = this.userSubject.asObservable();

  constructor(private auth0: AuthService, private api: ApiService) {
    
    // When Auth0 logs out → clear local storage and state
    this.auth0.isAuthenticated$
      .pipe(
        filter(isAuth => !isAuth),
        tap(() => this.clearUserState())
      )
      .subscribe();

    // When Auth0 logs in → sync or create backend user
    this.auth0.isAuthenticated$
      .pipe(
        filter(Boolean),
        switchMap(() => this.auth0.user$.pipe(take(1))),
        switchMap((profile: any) => this.syncBackendUser(profile))
      )
      .subscribe();
  }

  /** Restore cached user from storage */
  private loadStoredUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  /** Save user to both subject and storage */
  private setUser(user: any) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  /** Remove user everywhere */
  private clearUserState() {
    localStorage.removeItem(USER_STORAGE_KEY);
    this.userSubject.next(null);
  }

  /** Login + Create/Load backend user */
  private syncBackendUser(profile: any) {
    const payload = {
      name: profile?.name,
      pictureUrl: profile?.picture
    };

    return this.api.request<UserResponse>({
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
    this.auth0.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  /** Returns current user synchronously */
  public getCurrentUserSync() {
    return this.userSubject.value;
  }

  /** Returns authentication observable */
  public isAuthenticated$(): Observable<boolean> {
    return this.auth0.isAuthenticated$;
  }

  /** Manual backend refresh (optional) */
  public refreshUserFromBackend() {
    return this.api.request<any>({
      method: 'GET',
      path: '/users'
    }).pipe(
      take(1),
      tap(res => {
        const user = res?.data ?? res?.user ?? res;
        if (user) this.setUser(user);
      }),
      catchError(() => of(null))
    ).subscribe();
  }
}