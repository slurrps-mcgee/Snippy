import { Component, Inject, DOCUMENT } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { AuthLocalService } from '../../services/auth/auth.local.service';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Inject the AuthService to enable authentication features.
  constructor(
    @Inject(DOCUMENT) public document: Document, 
    public auth: AuthService,
    private authLocal: AuthLocalService
  ) {}

  login() {
    this.auth.loginWithRedirect({appState: { target: '/home' }});
  }

  logout() {
    // Use AuthLocalService logout for consistent state management
    this.authLocal.logout();
  }
}