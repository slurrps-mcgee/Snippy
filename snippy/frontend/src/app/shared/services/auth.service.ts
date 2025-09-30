import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';

function parseJwt(token: string | null) {
if (!token) return null;
try {
const payload = token.split('.')[1];
const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
return JSON.parse(decodeURIComponent(escape(decoded)));
} catch {
return null;
}
}

@Injectable({ providedIn: 'root' })
export class LocalAuthService {
private tokenKey = 'snippy_token';
private authSubject = new BehaviorSubject<boolean>(this.hasValidToken());
public isAuthenticated$ = this.authSubject.asObservable();

constructor(private http: HttpClient) {}

setToken(token: string) {
localStorage.setItem(this.tokenKey, token);
this.authSubject.next(this.hasValidToken());
}

getToken(): string | null {
return localStorage.getItem(this.tokenKey);
}

clearToken() {
localStorage.removeItem(this.tokenKey);
this.authSubject.next(false);
}

hasValidToken(): boolean {
const token = this.getToken();
const payload = parseJwt(token);
if (!payload) return false;
if (!payload.exp) return false;
return payload.exp * 1000 > Date.now();
}

// Optional: validate token with backend and get user
whoAmI(): Observable<any> {
const token = this.getToken();
if (!token) return of(null);
return this.http.get('/api/v1/auth/me').pipe(
tap(() => this.authSubject.next(true)),
catchError(() => {
this.clearToken();
return of(null);
})
);
}
}