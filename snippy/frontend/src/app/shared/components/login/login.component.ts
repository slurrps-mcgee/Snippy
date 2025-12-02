import { Component, Inject, DOCUMENT } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { AuthLocalService } from '../../services/auth.local.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { User } from '../../interfaces/user.interface';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  user$!: ReturnType<typeof toSignal<User | null>>; // signal type

  // Inject the AuthService to enable authentication features.
  constructor(
    @Inject(DOCUMENT) public document: Document,
    public auth0Service: AuthService,
    private authLocalService: AuthLocalService
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }

  login() {
    this.auth0Service.loginWithRedirect({ appState: { target: '/home' } });
  }

  logout() {
    // Use AuthLocalService logout for consistent state management
    this.authLocalService.logout();
  }
}