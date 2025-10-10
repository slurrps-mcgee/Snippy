import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { from, of, of as observableOf } from 'rxjs';
import { catchError, distinctUntilChanged, filter, switchMap, tap, take } from 'rxjs/operators';
import { ApiService } from '../../services/api/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../../helpers/constants';

/**
 * Automatically persists Auth0 access token to sessionStorage when the user logs in.
 * This is a convenience for code that still relies on sessionStorage accessToken.
 * The Auth0 SDK itself handles secure token caching and silent renew; prefer
 * getAccessTokenSilently() directly when possible.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
    constructor(private auth0: Auth0Service, private api: ApiService) {
        // When user becomes authenticated, silently obtain an access token and store it
        this.auth0.isAuthenticated$.pipe(
            distinctUntilChanged(),
            filter(Boolean),
            switchMap(() => from(this.auth0.getAccessTokenSilently()).pipe(catchError(() => observableOf(null)))),
            tap((token) => {
                try {
                    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
                } catch (e) {
                    console.warn('Failed to save access token to sessionStorage', e);
                }
            }),
            catchError((err) => {
                console.warn('Failed to acquire access token silently', err);
                return of(null);
            })
        ).subscribe();

        // When user becomes unauthenticated (logged out), remove stored token
        this.auth0.isAuthenticated$.pipe(
            distinctUntilChanged(),
            filter((isAuth) => !isAuth),
            tap(() => {
                try {
                    sessionStorage.clear();
                } catch { /* ignore */ }
            })
        ).subscribe();

        // After login, always call backend /auth/register to ensure a user record exists in the app DB.
        // The route returns the created (or existing) user object which we persist to sessionStorage.
        this.auth0.isAuthenticated$.pipe(
            distinctUntilChanged(),
            filter(Boolean),
            switchMap(() => this.auth0.user$.pipe(take(1))),
            switchMap((profile: any) => {
                const email = profile?.email;
                if (!email) return of(null);

                // Acquire an Auth0 access token, then call backend /auth/register with the token in the Authorization header.
                return from(this.auth0.getAccessTokenSilently()).pipe(
                    switchMap((token: any) => {
                        if (!token) {
                            console.warn('No Auth0 access token available for register call');
                            return of(null);
                        }
                        const headers = { Authorization: `Bearer ${token}` };
                        return this.api.request<any>({ path: '/users', method: 'POST', body: { email }, headers }).pipe(
                            tap((res) => {
                                const user = res?.data ?? res?.user ?? res;
                                if (user) {
                                    try { sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)); } catch { }
                                }
                            }),
                            catchError((err: HttpErrorResponse) => {
                                console.warn('Backend register attempt failed', err?.status, err?.message || err);
                                return of(null);
                            })
                        );
                    }),
                    catchError((err) => {
                        console.warn('Failed to acquire access token for register', err);
                        return of(null);
                    })
                );
            })
        ).subscribe();
    }
}
