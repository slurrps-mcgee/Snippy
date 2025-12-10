import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { SnippetService } from '../../services/snippet.service';
import { AuthLocalService } from '../../services/auth.local.service';
import { CommonModule } from '@angular/common';
import { SnippetStateService } from '../../services/snippet-state.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
constructor(
    public auth0Service: AuthService,
    private router: Router,
    public snippetService: SnippetService,
    public snippetStateService: SnippetStateService,
    private authLocalService: AuthLocalService,
  ) {
  }
}
