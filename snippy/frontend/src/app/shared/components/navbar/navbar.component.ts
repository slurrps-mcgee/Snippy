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
import { SnippetService } from '../../services/snippet.service';
import { SnippetStateService } from '../../services/snippet-state.service';
import { AuthLocalService } from '../../services/auth.local.service';
import { SnippetSettingsDialogComponent } from '../dialogs/snippet-settings-dialog/snippet-settings-dialog.component';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../interfaces/user.interface';
import { SnackbarService } from '../../services/snackbar.service';
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
  user$!: ReturnType<typeof toSignal<User | null>>;
  private destroyRef = inject(DestroyRef);

  constructor(
    public auth0Service: AuthService,
    private router: Router,
    public snippetService: SnippetService,
    public snippetStateService: SnippetStateService,
    private authLocalService: AuthLocalService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
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
    this.snippetStateService.updateSnippetName(newName);
  }

  saveSnippet() {
    const isNew = !this.snippetStateService.snippet()?.shortId;
    
    this.snippetService.saveSnippet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {

          this.snackbarService.success('Snippet saved');
          
          // If it's a new snippet, navigate to the snippet editor page
          if (isNew && response.snippet?.shortId) {
            const currentUser = this.user$();
            if (currentUser?.userName) {
              this.router.navigate([currentUser.userName, 'snippet', response.snippet.shortId]);
            }
          }
        },
        error: (err) => {
          this.snackbarService.error('Failed to save snippet');
        }
      });
  }

  openSettings() {
    const snippet = this.snippetStateService.snippet();
    if (!snippet) return;

    const dialogRef = this.dialog.open(SnippetSettingsDialogComponent, {
      width: '500px',
      data: snippet
    });

    dialogRef.afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(result => {
      if (result) {
        this.snippetStateService.updateSnippetSettings(result);
      }
    });
  }
}
