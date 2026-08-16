import { Component, ViewChild, effect, AfterViewInit, OnInit, OnDestroy, inject, DestroyRef, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { AngularSplitModule } from 'angular-split';

import { SnippetEditorComponent } from '@app/components/editor/snippet-editor/snippet-editor.component';
import { SnippetPreviewComponent } from '@app/components/editor/snippet-preview/snippet-preview.component';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { CdnResource } from '@app/api/generated/models/cdn-resource';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnippetSaveUIService } from '@app/services/ui/snippet-save-ui.service';
import { EditorUiService } from '@app/services/ui/editor-ui.service';
import { ActivatedRoute } from '@angular/router';
import { AuthStoreService } from '@app/services/stores/auth.store.service';
import { PreviewConsoleService } from '@app/services/ui/preview-console.service';

@Component({
  selector: 'app-snippet-web-view',
  imports: [
    AngularSplitModule,
    SnippetEditorComponent,
    SnippetPreviewComponent
],
  templateUrl: './snippet-web-view.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './snippet-web-view.component.scss',
})
export class SnippetWebViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(SnippetPreviewComponent) previewComponent?: SnippetPreviewComponent;

  snippetStoreService = inject(SnippetStoreService);
  snippetSaveUIService = inject(SnippetSaveUIService);
  editorUi = inject(EditorUiService);

  private route = inject(ActivatedRoute);
  private authStoreService = inject(AuthStoreService);
  private previewConsole = inject(PreviewConsoleService);
  private destroyRef = inject(DestroyRef);

  get user() { return this.authStoreService.user; }
  get selectedLayout() { return this.editorUi.layout(); }
  get isGuest() { return this.editorUi.guestMode(); }

  snippetId: string | null = null;
  error: string | null = null;
  private viewRecorded = false;
  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('window:keydown.control.s', ['$event'])
  onSaveShortcut(event: Event) {
    if (this.isGuest) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    this.snippetSaveUIService.saveSnippetWithUI(this.snippetStoreService, this.user);
  }

  constructor() {
    effect(() => {
      const snippet = this.snippetStoreService.snippet();
      const previewUpdateType = this.snippetStoreService.previewUpdateType();
      this.editorUi.layout();

      if (!previewUpdateType || !snippet?.snippetFiles) return;

      const html = snippet.snippetFiles.find(f => f.fileType === 'html')?.content || '';
      const css = snippet.snippetFiles.find(f => f.fileType === 'css')?.content || '';
      const js = snippet.snippetFiles.find(f => f.fileType === 'js')?.content || '';
      const cdn = snippet.cdnResources || [];

      if (previewUpdateType === 'partial') {
        this.updatePreview(html, css, js, 'partial', cdn);
        return;
      }

      if (this.previewTimer) clearTimeout(this.previewTimer);
      this.previewTimer = setTimeout(() => {
        this.updatePreview(html, css, js, 'full', cdn);
      }, 200);
    });

    effect(() => {
      const snippet = this.snippetStoreService.snippet();
      if (!snippet?.snippetId || snippet.isOwner || this.viewRecorded) return;
      this.viewRecorded = true;
      void this.snippetStoreService.recordView(snippet.snippetId);
    });
  }

  ngAfterViewInit() {}

  ngOnInit(): void {
    const guest = !!this.route.snapshot.data['guest'];
    const share = !!this.route.snapshot.data['share'];
    this.editorUi.setGuestMode(guest || share);

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        const token = params.get('token');
        this.snippetId = id;
        this.viewRecorded = false;
        this.error = null;

        if (share && token) {
          void this.snippetStoreService.loadSharedSnippet(token).then(() => {
            const snip = this.snippetStoreService.snippet();
            this.editorUi.setGuestMode(!snip?.isOwner);
          });
        } else if (id && !guest) {
          void this.snippetStoreService.loadSnippet(id);
        } else {
          this.initBlankSnippet(guest);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    this.editorUi.setGuestMode(false);
    this.previewConsole.setOpen(false);
    this.previewConsole.clear();
    this.snippetStoreService.clearSnippet();
  }

  private initBlankSnippet(guest: boolean) {
    this.snippetStoreService.clearSnippet();
    this.snippetStoreService.setSnippet({
      shortId: '',
      name: guest ? 'Try Snippy' : 'Untitled',
      description: '',
      tags: [],
      isPrivate: false,
      forkCount: 0,
      viewCount: 0,
      commentCount: 0,
      favoriteCount: 0,
      parentShortId: '',
      isOwner: true,
      displayName: guest ? 'Guest' : (this.user()?.displayName || ''),
      snippetFiles: [
        { fileType: 'html', content: guest ? '<h1>Hello, Snippy!</h1>\n<p>Edit HTML, CSS, and JS — preview updates live.</p>\n' : '' },
        { fileType: 'css', content: guest ? 'body {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n}\n' : '' },
        { fileType: 'js', content: guest ? 'console.log("Welcome to Snippy");\n' : '' },
      ],
      cdnResources: [],
    }, false);
    this.snippetStoreService.previewUpdateType.set('full');
    this.snippetStoreService.loading.set(false);
  }

  private updatePreview(
    html: string,
    css: string,
    js: string,
    previewUpdateType: string | null,
    cdnResources: CdnResource[] = []
  ) {
    if (!this.previewComponent) {
      setTimeout(() => {
        if (this.previewComponent) {
          this.previewComponent.updatePreview(html, css, js, previewUpdateType, cdnResources);
        }
      }, 100);
      return;
    }

    this.previewComponent.updatePreview(html, css, js, previewUpdateType, cdnResources);
  }
}
