import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { AuthStoreService } from '../../services/store.services/authStore.service';
import { CommonModule } from '@angular/common';
import { SnippetStoreService } from '../../services/store.services/snippet.store.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  auth0Service = inject(AuthService);
  snippetStoreService = inject(SnippetStoreService);
  
  private router = inject(Router);
  private authStoreService = inject(AuthStoreService);
}
