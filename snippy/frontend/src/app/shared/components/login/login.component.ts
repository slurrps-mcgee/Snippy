import { Component, Inject, DOCUMENT } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { AuthLocalService } from '../../services/auth.local.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../interfaces/user.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { SnippetService } from '../../services/snippet.service';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';

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
    private authLocalService: AuthLocalService,
    private snippetService: SnippetService,
    private dialog: MatDialog
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }

  login() {
    this.auth0Service.loginWithRedirect({ appState: { target: '/home' } });
  }

  logout() {
    if (this.snippetService.isDirty()) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to logout?',
          confirmText: 'Logout',
          cancelText: 'Cancel'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.authLocalService.logout();
        }
      });
    } else {
      this.authLocalService.logout();
    }
  }
}