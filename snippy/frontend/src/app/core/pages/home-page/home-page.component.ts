import { Component, DOCUMENT, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home-page',
  imports: [MatButton, MatIconModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  private router = inject(Router);

  // Use signal directly from AuthStoreService
  get user() { return this.authStoreService.user; }

  document = inject(DOCUMENT);
  auth0Service = inject(AuthService);
  private authStoreService = inject(AuthStoreService);

  login() {
    this.auth0Service.loginWithRedirect({ appState: { target: '/home' } });
  }
}
