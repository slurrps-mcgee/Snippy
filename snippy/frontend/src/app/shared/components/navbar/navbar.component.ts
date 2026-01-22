import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { LoginComponent } from "../login/login.component";
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SnippetStoreService } from '../../services/store.services/snippet.store.service';
import { AuthStoreService } from '../../services/store.services/authStore.service';
import { SnippetSettingsDialogComponent } from '../dialogs/snippet-settings-dialog/snippet-settings-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnackbarService } from '../../services/component.services/snackbar.service';
import {MatTabsModule} from '@angular/material/tabs';

@Component({
  selector: 'app-navbar',
  imports: [
    LoginComponent, 
    CommonModule, 
    RouterModule,
    MatButtonToggleModule, 
    MatButtonModule, 
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    FormsModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  selectedPageIndex = 0;
  // Use signal directly from AuthStoreService
  get user() { return this.authStoreService.user; }
  private destroyRef = inject(DestroyRef);

  constructor(
    public auth0Service: AuthService,
    private router: Router,
    public snippetStoreService: SnippetStoreService,
    private authStoreService: AuthStoreService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) {
    // No longer needed: use signal directly
  }

  ngOnInit(): void {
  }
  
  onPageTabChange(index: number) {
    // Navigate based on tab index
    if (index === 0) {
      this.router.navigate(['/home']);
    } else if (index === 1) {
      this.router.navigate(['/public']);
    }
  }

  onSnippetNameChange(newName: string) {
    this.snippetStoreService.updateSnippetName(newName);
  }

  async saveSnippet() {
    const isNew = !this.snippetStoreService.snippet()?.shortId;
    try {
      const response = await this.snippetStoreService.saveSnippet();
      this.snackbarService.success('Snippet saved');
      // If it's a new snippet, navigate to the snippet editor page
      if (isNew && response.snippet?.shortId) {
        const currentUser = this.user();
        if (currentUser?.userName) {
          this.router.navigate([currentUser.userName, 'snippet', response.snippet.shortId]);
        }
      }
    } catch (err) {
      this.snackbarService.error('Failed to save snippet');
    }
  }

  openSettings() {
    const snippet = this.snippetStoreService.snippet();
    if (!snippet) return;

    const dialogRef = this.dialog.open(SnippetSettingsDialogComponent, {
      width: '50vw',
      height: '80vh',
      maxWidth: '50vw',
      maxHeight: '80vh',
      data: snippet
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snippetStoreService.updateSnippetSettings(result);
          // Automatically save after updating settings
          this.saveSnippet();
        }
      });
  }
}
