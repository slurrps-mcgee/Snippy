// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LocalAuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable({
providedIn: 'root'
})
export class AuthGuard implements CanActivate {
constructor(private auth: LocalAuthService, private router: Router) {}

canActivate() {
return this.auth.isAuthenticated$.pipe(
tap(loggedIn => {
if (!loggedIn) {
this.router.navigate(['/login']); // redirect if not logged in
}
})
);
}
}