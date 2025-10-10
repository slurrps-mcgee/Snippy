import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, from } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';

@Injectable({ providedIn: 'root' })
export class APIInterceptor implements HttpInterceptor {
    private refreshing = false;
    private refreshSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    constructor(private http: HttpClient, private auth0: Auth0Service) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Workflow:
    // 1. If Auth0 says user is authenticated, request a token via getAccessTokenSilently() and attach it.
    // 2. Otherwise fall back to sessionStorage 'accessToken' (legacy).
    // 3. On 401 attempt a silent Auth0 refresh (ignoreCache:true). If that fails, propagate the 401 so the app can logout/redirect.
        return this.auth0.isAuthenticated$.pipe(
            take(1),
            switchMap((isAuth) => {
                if (isAuth) {
                    // Preferred path: use Auth0 SDK token
                    return from(this.auth0.getAccessTokenSilently()).pipe(
                        switchMap((token) => {
                            if (token && !req.headers.has('Authorization')) {
                                req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
                            }
                            return next.handle(req).pipe(
                                catchError(err => {
                                    if (err && err.status === 401) {
                                                return this.tryAuth0Refresh(req, next);
                                            }
                                    return throwError(() => err);
                                })
                            );
                        })
                    );
                }

                // Attach Bearer token from sessionStorage if present and not already set
                try {
                    const stored = sessionStorage.getItem('accessToken');
                    if (stored && !req.headers.has('Authorization')) {
                        req = req.clone({ setHeaders: { Authorization: `Bearer ${stored}` } });
                    }
                } catch (e) {
                    // sessionStorage may be unavailable in some environments; ignore
                }

                return next.handle(req).pipe(
                    catchError(err => {
                        if (err && err.status === 401) {
                            return this.tryAuth0Refresh(req, next);
                        }
                        return throwError(() => err);
                    })
                );
            })
        );
    }

    private tryAuth0Refresh(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Attempt a silent token refresh with Auth0's SDK (ignore cache to force a refresh)
        if (!this.refreshing) {
            this.refreshing = true;
            this.refreshSubject.next(null);

            return from((this.auth0 as any).getAccessTokenSilently({ ignoreCache: true } as any)).pipe(
                switchMap((newTokenRaw: any) => {
                    const newToken = typeof newTokenRaw === 'string' ? newTokenRaw : (newTokenRaw?.access_token ?? String(newTokenRaw));
                    if (newToken) {
                        // Persist legacy sessionStorage for compatibility
                        try { sessionStorage.setItem('accessToken', newToken); } catch {}
                        this.refreshSubject.next(newToken);
                        return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
                    }
                    // No token returned -> propagate 401
                    this.refreshSubject.next(null);
                    return throwError(() => new Error('Unable to refresh token via Auth0'));
                }),
                catchError((e) => {
                    this.refreshSubject.next(null);
                    return throwError(() => e);
                }),
                finalize(() => {
                    this.refreshing = false;
                })
            );
        }

        // If another refresh is ongoing, wait for it
        return this.refreshSubject.pipe(
            take(1),
            switchMap(token => {
                if (!token) return throwError(() => new Error('Unable to refresh token'));
                return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
            })
        );
    }
}
