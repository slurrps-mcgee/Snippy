import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { tap } from "rxjs";


@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string, password: string }) {
    return this.http.post<{ user: any, accessToken: string }>('/api/v1/auth/login', credentials, { withCredentials: true })
      .pipe(
        tap(res => {
          // Save user to sessionStorage
          sessionStorage.setItem('user', JSON.stringify(res.user));
          // Optional: redirect after login
          this.router.navigate(['/dashboard']);
        })
      );
  }

  register(data: any) {
    return this.http.post<{ user: any, accessToken: string }>('/api/v1/auth/register', data, { withCredentials: true })
      .pipe(
        tap(res => {
          sessionStorage.setItem('user', JSON.stringify(res.user));
          this.router.navigate(['/dashboard']);
        })
      );
  }

  logout() {
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getUser() {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  }
}
