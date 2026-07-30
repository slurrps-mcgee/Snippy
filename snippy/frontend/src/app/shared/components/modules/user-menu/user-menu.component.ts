import { Component, DOCUMENT, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '../../../services/store.services/authStore.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { SnippetStoreService } from '../../../services/store.services/snippet.store.service';
import { AssetsDialogComponent } from '../../dialogs/assets-dialog/assets-dialog.component';
import { DialogService } from '../../../services/component.services/dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  get user() { return this.authStoreService.user; }

  document = inject(DOCUMENT);
  private router = inject(Router);
  private authStoreService = inject(AuthStoreService);
  private snippetStoreService = inject(SnippetStoreService);
  private dialogService = inject(DialogService);

  async logout() {
    if (this.snippetStoreService.isDirty()) {
      const ok = await this.dialogService.confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to logout?',
        confirmText: 'Logout',
        cancelText: 'Cancel',
      });
      if (ok) {
        this.authStoreService.logout();
      }
    } else {
      this.authStoreService.logout();
    }
  }

  settings() {
    this.router.navigate(['/settings']);
  }

  home() {
    this.router.navigate(['/home']);
  }

  profile() {
    const name = this.user()?.userName;
    if (name) this.router.navigate(['/', name]);
  }

  assets() {
    this.dialogService.open(AssetsDialogComponent, 'lg');
  }

  createNewSnippet() {
    this.router.navigate(['snippet']);
  }
}
