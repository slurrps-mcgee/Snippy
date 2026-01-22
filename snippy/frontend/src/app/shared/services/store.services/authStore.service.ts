import { Injectable, signal, effect, computed } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { of, tap, filter, take, catchError } from 'rxjs';
import { AuthAPIService } from '../api.services/auth.api.service';
import { UserResponse } from '../../interfaces/userResponse.interface';
import { User } from '../../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  /**
   * Signal-based user state
   */
  readonly user = signal<User | null>(null);

  /**
   * Derived signal for authentication status
   */
  readonly isAuthenticated = computed(() => !!this.user());

  constructor(private auth0Service: AuthService, private authApiService: AuthAPIService) {
    // Effect: react to Auth0 authentication changes
    effect(() => {
      this.auth0Service.isAuthenticated$.subscribe(isAuth => {
        if (!isAuth) {
          this.clearUserState();
        } else {
          this.auth0Service.user$.pipe(take(1)).subscribe(profile => {
            this.syncBackendUser(profile);
          });
        }
      });
    });
  }

  /** Save user to signal */
  private setUser(user: User) {
    this.user.set(user);
  }

  /** Clear user state */
  private clearUserState() {
    this.user.set(null);
  }

  /** Login + Create/Load backend user */
  private syncBackendUser(profile: any) {
    this.authApiService.syncBackendUser(profile).pipe(
      tap(res => {
        const user = res?.user ?? res;
        if (user) this.setUser(user);
      }),
      catchError((err) => {
        console.warn('User sync failed', err);
        return of(null);
      })
    ).subscribe();
  }

  /** Manual logout trigger */
  public logout() {
    this.clearUserState();
    this.auth0Service.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  /** Returns current user synchronously */
  public getCurrentUserSync() {
    return this.user();
  }


  /** Returns authentication status as signal */
  public isAuthenticatedSignal() {
    return this.isAuthenticated;
  }

  /** Refresh user from backend and update signal */
  public refreshUserFromBackend() {
    this.authApiService.getCurrentUser().pipe(
      tap(res => {
        if (res?.user) this.setUser(res.user);
      }),
      catchError(() => {
        console.warn('User refresh failed');
        return of(null);
      })
    ).subscribe();
  }
}