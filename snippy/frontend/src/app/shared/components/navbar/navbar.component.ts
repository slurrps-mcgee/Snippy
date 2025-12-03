import { Component, OnInit } from '@angular/core';
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
import { AuthLocalService } from '../../services/auth.local.service';
import { SnippetSettingsDialogComponent } from '../snippet-settings-dialog/snippet-settings-dialog.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../interfaces/user.interface';
import { SnackbarService } from '../../services/snackbar.service';

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
    FormsModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  selectedPage = 'home';
  user$!: ReturnType<typeof toSignal<User | null>>;

  constructor(
    public auth0Service: AuthService,
    private router: Router,
    public snippetService: SnippetService,
    private authLocalService: AuthLocalService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }

  ngOnInit(): void {
  }
  
  onPageChange(event: any) {
    // Navigate to the selected page
    this.router.navigate(['/', event.value]);
  }

  onSnippetNameChange(newName: string) {
    this.snippetService.updateSnippetName(newName);
  }

  saveSnippet() {
    const isNew = !this.snippetService.snippet()?.shortId;
    
    this.snippetService.saveSnippet().subscribe({
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
    const snippet = this.snippetService.snippet();
    if (!snippet) return;

    const dialogRef = this.dialog.open(SnippetSettingsDialogComponent, {
      width: '500px',
      data: snippet
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snippetService.updateSnippetSettings(result);
      }
    });
  }
}
