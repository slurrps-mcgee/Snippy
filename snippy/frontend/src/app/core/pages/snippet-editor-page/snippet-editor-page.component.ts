import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { SnippetService } from '../../../shared/services/snippet.service';
import { CommonModule } from '@angular/common';
import { AuthLocalService } from '../../../shared/services/auth.local.service';
import { User } from '../../../shared/interfaces/user.interface';
import { SnippetWebViewComponent } from "../../../shared/components/snippet-web-view/snippet-web-view.component";

@Component({
  selector: 'app-snippet-editor-page',
  imports: [CommonModule, SnippetWebViewComponent],
  templateUrl: './snippet-editor-page.component.html',
  styleUrl: './snippet-editor-page.component.scss'
})
export class SnippetEditorPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: SnippetWebViewComponent;
  
  user$!: ReturnType<typeof toSignal<User | null>>;
  username: string | null = null;
  snippetId: string | null = null;
  loading = true;
  error: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    public snippetService: SnippetService,
    private authLocalService: AuthLocalService
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }

  ngOnInit(): void {
    this.username = this.route.snapshot.paramMap.get('username');
    this.snippetId = this.route.snapshot.paramMap.get('id');

    if (this.snippetId) {
      this.snippetService.fetchSnippet(this.snippetId).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load snippet:', err);
          this.error = 'Failed to load snippet';
          this.loading = false;
        }
      });
    } else {
      // No snippet ID - create a new empty snippet
      this.snippetService.setSnippet({
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
      });
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.snippetService.clearSnippet();
  }
}
