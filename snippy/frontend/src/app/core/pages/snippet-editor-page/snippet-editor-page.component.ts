import { Component, OnInit, ViewChild, OnDestroy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { User } from '../../../shared/interfaces/user.interface';
import { SnippetWebViewComponent } from "../../../shared/components/views/snippet-web-view/snippet-web-view.component";
import { HostListener } from '@angular/core';
import { SnackbarService } from '../../../shared/services/component.services/snackbar.service';

@Component({
  selector: 'app-snippet-editor-page',
  imports: [CommonModule, SnippetWebViewComponent],
  templateUrl: './snippet-editor-page.component.html',
  styleUrl: './snippet-editor-page.component.scss'
})
export class SnippetEditorPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: SnippetWebViewComponent;

  // Use signal directly from AuthStore
  get user() { return this.authStoreService.user; }
  snippetId: string | null = null;
  error: string | null = null;

  // Window Shortcuts
  @HostListener('window:keydown.control.s', ['$event'])
  onSaveShortcut(event: Event) {
    event.preventDefault();
    this.saveSnippet();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public snippetStoreService: SnippetStoreService,
    private authStoreService: AuthStoreService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.snippetId = this.route.snapshot.paramMap.get('id');

    if (this.snippetId) {
      this.snippetStoreService.loadSnippet(this.snippetId);
    } else {
      // No snippet ID - create a new empty snippet
      this.snippetStoreService.setSnippet({
        shortId: '',
        name: 'Untitled',
        description: '',
        tags: [],
        isPrivate: false,
        forkCount: 0,
        viewCount: 0,
        commentCount: 0,
        favoriteCount: 0,
        parentShortId: '',
        isOwner: true,
        displayName: this.user()?.displayName || '',
        snippetFiles: [
          { fileType: 'html', content: '' },
          { fileType: 'css', content: '' },
          { fileType: 'js', content: '' }
        ]
      }, false);
      this.snippetStoreService.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.snippetStoreService.clearSnippet();
  }

  async saveSnippet() {
    const isNew = !this.snippetStoreService.snippet()?.shortId;
    if (!this.snippetStoreService.isDirty()) return;
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
}
