// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ApiService } from '../api/api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private api: ApiService, private router: Router) { }

  canActivate(): Observable<boolean> {
    //Add a check here for isAuthenticated
    

    // Call backend to validate token and get current user. We intentionally
    // don't reject immediately on a locally-expired token — the HTTP
    // interceptor will attempt a refresh and retry the request. If that
    // ultimately fails the error is handled below.
    return this.api.request({ path: '/auth/me', method: 'GET' }).pipe(
      map(() => true),
      catchError(() => {
        //set isAuthenticated to false
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}