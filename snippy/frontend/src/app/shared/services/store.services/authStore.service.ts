import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { of, tap, take, catchError, switchMap, EMPTY, filter, finalize, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthAPIService } from '../api.services/auth.api.service';
import { User } from '../../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  /**
   * Backend user profile (null until Auth0 session is synced via POST /users).
   * Auth0 AuthGuard may pass before this is set — wait for this signal when you need the API user.
   */
  readonly user = signal<User | null>(null);

  /** True when backend user row is loaded (not merely Auth0 session). */
  readonly isAuthenticated = computed(() => !!this.user());

  /** True while an Auth0→backend sync is in flight. */
  readonly syncing = signal(false);

  private auth0Service = inject(AuthService);
  private authApiService = inject(AuthAPIService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.auth0Service.isAuthenticated$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((isAuth) => {
          if (!isAuth) {
            this.clearUserState();
            this.syncing.set(false);
            return EMPTY;
          }

          this.syncing.set(true);
          return this.auth0Service.user$.pipe(
            filter((profile): profile is NonNullable<typeof profile> => !!profile),
            take(1),
            switchMap((profile) =>
              this.authApiService.syncBackendUser(profile).pipe(
                tap((res) => {
                  const user = res?.user ?? res;
                  if (user) this.setUser(user as User);
                }),
                catchError((err) => {
                  console.warn('User sync failed', err);
                  return of(null);
                })
              )
            ),
            finalize(() => this.syncing.set(false))
          );
        })
      )
      .subscribe();
  }

  private setUser(user: User) {
    this.user.set(user);
  }

  /** Merge fields into the cached backend user (e.g. after settings save). */
  public patchUser(partial: Partial<User>) {
    this.user.update(u => (u ? { ...u, ...partial } : u));
  }

  public setUserFromApi(user: User) {
    this.setUser(user);
  }

  private clearUserState() {
    this.user.set(null);
  }

  public logout() {
    this.clearUserState();
    this.auth0Service.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  public async refreshUserFromBackend() {
    try {
      const res = await firstValueFrom(this.authApiService.getCurrentUser());
      if (res?.user) this.setUser(res.user);
    } catch {
      console.warn('User refresh failed');
    }
  }
}
