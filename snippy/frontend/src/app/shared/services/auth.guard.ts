// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LocalAuthService } from './auth.service';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: LocalAuthService, private api: ApiService, private router: Router) { }

  canActivate(): Observable<boolean> {
    const token = this.auth.getToken();

    // No token -> redirect to login
    if (!token) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // Quick local expiry check
    if (!this.auth.hasValidToken()) {
      this.auth.clearToken();
      this.router.navigate(['/login']);
      return of(false);
    }

    // Validate token with backend using ApiService. If the call succeeds, allow.
    return this.api.request({ path: '/auth/me', method: 'GET' }).pipe(
      map(() => true),
      catchError(() => {
        // on any error treat as unauthenticated
        this.auth.clearToken();
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}