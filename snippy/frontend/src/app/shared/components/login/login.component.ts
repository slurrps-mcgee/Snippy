import { Component, Inject, DOCUMENT, inject, DestroyRef } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '../../services/store.services/authStore.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../interfaces/user.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnippetStoreService } from '../../services/store.services/snippet.store.service';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Use signal directly from AuthStoreService
  get user() { return this.authStoreService.user; }

  private destroyRef = inject(DestroyRef);

  // Inject the AuthService to enable authentication features.
  constructor(
    @Inject(DOCUMENT) public document: Document,
    public auth0Service: AuthService,
    private authStoreService: AuthStoreService,
    private snippetStoreService: SnippetStoreService,
    private dialog: MatDialog
  ) {
    // No longer needed: use signal directly
  }

  login() {
    this.auth0Service.loginWithRedirect({ appState: { target: '/home' } });
  }

  logout() {
    if (this.snippetStoreService.isDirty()) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to logout?',
          confirmText: 'Logout',
          cancelText: 'Cancel'
        }
      });

      dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.authStoreService.logout();
        }
      });
    } else {
      this.authStoreService.logout();
    }
  }
}