import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { of, timer } from 'rxjs';
import { catchError, distinctUntilChanged, filter, switchMap, tap, take, retry, startWith } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { USER_STORAGE_KEY } from '../../helpers/constants';
import { BehaviorSubject, Observable } from 'rxjs';

// Service to manage authentication user info

@Injectable({ providedIn: 'root' })
export class AuthLocalService {
    private userSubject: BehaviorSubject<any>;
    public user$: Observable<any>;
    private tokenCheckInterval = 300000; // Check token validity every 5 minutes

    constructor(private auth0: AuthService, private api: ApiService) {
        // seed from localStorage if available
        let existing = null;
        try {
            const raw = localStorage.getItem(USER_STORAGE_KEY);
            existing = raw ? JSON.parse(raw) : null;
        } catch {
            existing = null;
        }

        this.userSubject = new BehaviorSubject<any>(existing);
        this.user$ = this.userSubject.asObservable();

        // When user becomes unauthenticated (logged out), clear localStorage and emit null
        this.auth0.isAuthenticated$.pipe(
            distinctUntilChanged(),
            filter((isAuth) => !isAuth),
            tap(() => {
                try {
                    localStorage.removeItem(USER_STORAGE_KEY);
                } catch { /* ignore */ }
                this.userSubject.next(null);
            })
        ).subscribe();

        // After login, call backend to ensure a user record exists if not create one, then persist and emit it.
        this.auth0.isAuthenticated$.pipe(
            distinctUntilChanged(),
            filter(Boolean),
            switchMap(() => this.auth0.user$.pipe(take(1))),
            switchMap((profile: any) => {
                const name = profile?.name;
                const pictureUrl = profile?.picture;

                return this.api.request<any>({ path: '/users', method: 'POST', body: { pictureUrl, name } }).pipe(
                    tap((res) => {
                        const user = res?.data ?? res?.user ?? res;

                        if (user) {
                            try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)); } catch { }
                            this.userSubject.next(user);
                        }
                    }),
                    catchError((err: HttpErrorResponse) => {
                        console.warn('Backend register attempt failed', err?.status, err?.message || err);
                        return of(null);
                    })
                );
            })
        ).subscribe();

        // Set up periodic token validation when user is authenticated
        this.auth0.isAuthenticated$.pipe(
            distinctUntilChanged(),
            switchMap(isAuth => isAuth ? 
                timer(this.tokenCheckInterval, this.tokenCheckInterval).pipe(
                    startWith(0),
                    tap(() => this.validateTokenAndSync())
                ) : 
                of(null)
            )
        ).subscribe();
    }

    /** 
     * Validate Auth0 token and sync authentication state
     * If token is invalid/expired, trigger logout
     */
    private validateTokenAndSync(): void {
        this.auth0.getAccessTokenSilently().pipe(
            take(1),
            catchError((error) => {
                console.warn('Token validation failed, logging out:', error);
                this.logout();
                return of(null);
            })
        ).subscribe(token => {
            if (token) {
                // Token is valid - optionally refresh user data from backend
                this.refreshUserFromBackend();
            }
        });
    }

    /** 
     * Manual logout - clears Auth0 session and local storage
     * Redirects to Auth0 logout with return URL
     */
    public logout(): void {
        // Clear local storage first
        try {
            localStorage.removeItem(USER_STORAGE_KEY);
        } catch { 
            // ignore 
        }
        
        // Clear user state
        this.userSubject.next(null);
        
        // Trigger Auth0 logout with redirect
        this.auth0.logout({ 
            logoutParams: { 
                returnTo: window.location.origin 
            } 
        });
    }

    /** 
     * Check if user is currently authenticated
     * Returns observable of authentication state
     */
    public isAuthenticated$(): Observable<boolean> {
        return this.auth0.isAuthenticated$;
    }

    /** 
     * Get current user synchronously from local state
     */
    public getCurrentUserSync(): any {
        return this.userSubject.value;
    }

    /** 
     * Force refresh user data from backend
     * Useful after profile updates or when sync is needed
     */
    public refreshUserFromBackend(): void {
        this.auth0.isAuthenticated$.pipe(
            take(1),
            filter(Boolean),
            switchMap(() => 
                this.api.request<any>({ method: 'GET', path: '/users' }).pipe(
                    retry(2), // Retry failed requests twice
                    catchError((error: HttpErrorResponse) => {
                        if (error.status === 401 || error.status === 403) {
                            // Authentication/authorization error - trigger logout
                            console.warn('Backend authentication failed, logging out');
                            this.logout();
                        }
                        return of(null);
                    })
                )
            )
        ).subscribe({
            next: (res) => {
                if (res) {
                    const user = res?.data ?? res?.user ?? res;
                    if (user) {
                        try { 
                            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)); 
                        } catch { 
                            // ignore storage errors 
                        }
                        this.userSubject.next(user);
                    }
                }
            },
            error: () => {
                // Additional error handling already done in catchError above
            }
        });
    }

    /** 
     * Optional: manually refresh user from the backend (GET /users)
     * @deprecated Use refreshUserFromBackend() instead
     */
    public getCurrentUser(): void {
        this.refreshUserFromBackend();
    }
}
