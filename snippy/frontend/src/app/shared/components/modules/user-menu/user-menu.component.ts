import { Component, Inject, DOCUMENT, inject, DestroyRef } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '../../../services/store.services/authStore.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../interfaces/user.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnippetStoreService } from '../../../services/store.services/snippet.store.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  // Use signal directly from AuthStoreService
  get user() { return this.authStoreService.user; }

  document = inject(DOCUMENT);
  auth0Service = inject(AuthService);
  private router = inject(Router);
  private authStoreService = inject(AuthStoreService);
  private snippetStoreService = inject(SnippetStoreService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

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

  // Navigate to pages
  settings() {
    this.router.navigate(['/settings']);
  }

  home() {
    this.router.navigate(['/home']);
  }

  createNewSnippet() {
    this.router.navigate(['snippet']);
  }
}
