import { Component, Inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Inject the AuthService to enable authentication features.
  constructor(@Inject(DOCUMENT) public document: Document, public auth: AuthService) {}

  login() {
    this.auth.loginWithRedirect({appState: { target: '/home' }});
    const win: any = window as any;
  }

  logout() {
    this.auth.logout({ logoutParams: {returnTo: window.location.origin + '/'} });
  }
}