import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, switchMap, tap, take } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { USER_STORAGE_KEY } from '../../helpers/constants';
import { BehaviorSubject, Observable } from 'rxjs';

// Service to manage authentication user info

@Injectable({ providedIn: 'root' })
export class AuthLocalService {
    private userSubject: BehaviorSubject<any>;
    public user$: Observable<any>;

    constructor(private auth0: AuthService, private api: ApiService) {
        // seed from sessionStorage if available
        let existing = null;
        try {
            const raw = sessionStorage.getItem(USER_STORAGE_KEY);
            existing = raw ? JSON.parse(raw) : null;
        } catch {
            existing = null;
        }

        this.userSubject = new BehaviorSubject<any>(existing);
        this.user$ = this.userSubject.asObservable();

        // When user becomes unauthenticated (logged out), clear sessionStorage and emit null
        this.auth0.isAuthenticated$.pipe(
            distinctUntilChanged(),
            filter((isAuth) => !isAuth),
            tap(() => {
                try {
                    sessionStorage.clear();
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
                            try { sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)); } catch { }
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
    }

    /** Optional: manually refresh user from the backend (GET /users) */
    public getCurrentUser(): void {
        this.api.request<any>({ method: 'GET', path: '/users' }).pipe(take(1)).subscribe({
            next: (res) => {
                const user = res?.data ?? res?.user ?? res;
                if (user) {
                    try { sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)); } catch { }
                    this.userSubject.next(user);
                }
            },
            error: () => {
                // ignore
            }
        });
    }
}
