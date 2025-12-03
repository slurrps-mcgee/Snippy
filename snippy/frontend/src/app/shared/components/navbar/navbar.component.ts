import { Component, OnInit } from '@angular/core';
import { LoginComponent } from "../login/login.component";
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SnippetService } from '../../services/snippet.service';
import { AuthLocalService } from '../../services/auth.local.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-navbar',
  imports: [
    LoginComponent, 
    CommonModule, 
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
    private authLocalService: AuthLocalService
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

        //TODO: Add to a notification service instead of console logging
        console.log('Snippet saved successfully', response);
        
        // If it's a new snippet, navigate to the snippet editor page
        if (isNew && response.snippet?.shortId) {
          const currentUser = this.user$();
          if (currentUser?.userName) {
            this.router.navigate([currentUser.userName, 'snippet', response.snippet.shortId]);
          }
        }
      },
      error: (err) => {
        console.error('Failed to save snippet:', err);
      }
    });
  }
}
