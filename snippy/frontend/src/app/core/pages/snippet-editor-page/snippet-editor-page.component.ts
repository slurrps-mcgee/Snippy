import { Component, OnInit, ViewChild, OnDestroy, DestroyRef, inject } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SnippetService } from '../../../shared/services/snippet.service';
import { SnippetStateService } from '../../../shared/services/snippet-state.service';
import { CommonModule } from '@angular/common';
import { AuthLocalService } from '../../../shared/services/auth.local.service';
import { User } from '../../../shared/interfaces/user.interface';
import { SnippetWebViewComponent } from "../../../shared/components/views/snippet-web-view/snippet-web-view.component";
import { HostListener } from '@angular/core';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-snippet-editor-page',
  imports: [CommonModule, SnippetWebViewComponent],
  templateUrl: './snippet-editor-page.component.html',
  styleUrl: './snippet-editor-page.component.scss'
})
export class SnippetEditorPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: SnippetWebViewComponent;

  user$!: ReturnType<typeof toSignal<User | null>>;
  snippetId: string | null = null;
  loading = true;
  error: string | null = null;
  private destroyRef = inject(DestroyRef);

  @HostListener('window:keydown.control.s', ['$event'])
  onSaveShortcut(event: Event) {
    event.preventDefault();
    this.saveSnippet();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public snippetService: SnippetService,
    public snippetStateService: SnippetStateService,
    private authLocalService: AuthLocalService,
    private snackbarService: SnackbarService
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }

  ngOnInit(): void {
    this.snippetId = this.route.snapshot.paramMap.get('id');

    if (this.snippetId) {
      this.snippetService.getSnippet(this.snippetId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load snippet:', err);
            this.loading = false;
          }
        });
    } else {
      // No snippet ID - create a new empty snippet
      this.snippetStateService.setSnippet({
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
        displayName: this.user$()?.displayName || '',
        snippetFiles: [
          { fileType: 'html', content: '' },
          { fileType: 'css', content: '' },
          { fileType: 'js', content: '' }
        ]
      }, false);
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.snippetStateService.clearSnippet();
  }

  saveSnippet() {
    const isNew = !this.snippetStateService.snippet()?.shortId;

    if (!this.snippetStateService.isDirty()) return;

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
}
