import { Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { SnippetWebViewComponent } from "../../../shared/components/views/snippet-web-view/snippet-web-view.component";
import { HostListener } from '@angular/core';
import { SnippetSaveUIService } from '../../../shared/services/communication/snippet-save-ui.service';

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
    this.snippetSaveUIService.saveSnippetWithUI(this.snippetStoreService, this.user);
  }

  constructor(
    private route: ActivatedRoute,
    public snippetStoreService: SnippetStoreService,
    private authStoreService: AuthStoreService,
    private snippetSaveUIService: SnippetSaveUIService
    ) {
    }

  ngOnInit(): void {
    this.snippetId = this.route.snapshot.paramMap.get('id');

    if (this.snippetId) {
      this.snippetStoreService.loadSnippet(this.snippetId);
    } else {
      this.snippetStoreService.clearSnippet();
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
}
