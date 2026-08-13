import { Component, DOCUMENT, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { AuthStoreService } from '@app/services/stores/auth.store.service';
import { Router, RouterLink } from '@angular/router';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-home-page',
  imports: [MatButton, MatAnchor, MatIconModule, RouterLink],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  get user() { return this.authStoreService.user; }

  document = inject(DOCUMENT);
  private auth0Service = inject(AuthService);
  private authStoreService = inject(AuthStoreService);

  constructor() {
    // Logged-in users leave the marketing page for the app shell
    this.auth0Service.isAuthenticated$
      .pipe(
        filter(Boolean),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        void this.router.navigateByUrl('/home');
      });
  }

  login() {
    this.auth0Service.loginWithRedirect({ appState: { target: '/home' } });
  }
}
