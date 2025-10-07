import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class APIInterceptor implements HttpInterceptor {
    private refreshing = false;
    private refreshSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    constructor(private http: HttpClient) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError(err => {
                // Only attempt refresh on 401 and not when calling refresh endpoint itself
                if (err && err.status === 401 && !req.url.includes('/auth/refresh')) {
                    return this.handle401Error(req, next);
                }
                return throwError(() => err);
            })
        );
    }

    private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.refreshing) {
            this.refreshing = true;
            this.refreshSubject.next(null);

            // Call refresh endpoint; backend sets refresh token as HTTP-only cookie and returns new access token
            // withCredentials is required so the browser sends cookies to the API
            return this.http.post<{ accessToken: string }>('/api/v1/auth/refresh', {}).pipe(
                switchMap(res => {
                    const newToken = res?.accessToken;
                    if (newToken) {
                        this.refreshSubject.next(newToken);
                        return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
                    }
                    // If no token returned, logout
                    this.refreshSubject.next(null);
                    return throwError(() => new Error('No access token in refresh response'));
                }),
                catchError(err => {
                    this.refreshSubject.next(null);
                    return throwError(() => err);
                }),
                finalize(() => {
                    this.refreshing = false;
                })
            );
        } else {
            // Wait until refreshSubject has a non-null token then retry
            return this.refreshSubject.pipe(
                take(1),
                switchMap(token => {
                    if (!token) {
                        // No token available after refresh -> fail
                        return throwError(() => new Error('Unable to refresh token'));
                    }
                    return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
                })
            );
        }
    }
}
