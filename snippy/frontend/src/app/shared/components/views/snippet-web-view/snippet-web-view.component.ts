import { Component, ViewChild, effect, AfterViewInit, OnInit, OnDestroy, inject, DestroyRef, HostListener } from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { CommonModule } from '@angular/common';
import { SnippetEditorComponent } from '../../../../core/components/snippet-editor/snippet-editor.component';
import { SnippetPreviewComponent } from '../../../../core/components/snippet-preview/snippet-preview.component';
import { SnippetStoreService } from '../../../services/store.services/snippet.store.service';
import { ExternalResource } from '../../../interfaces/externalResource.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnippetSaveUIService } from '../../../services/communication/snippet-save-ui.service';
import { EditorUiService } from '../../../services/communication/editor-ui.service';
import { ActivatedRoute } from '@angular/router';
import { AuthStoreService } from '../../../services/store.services/authStore.service';

@Component({
  selector: 'app-snippet-web-view',
  imports: [
    CommonModule,
    AngularSplitModule,
    SnippetEditorComponent,
    SnippetPreviewComponent,
  ],
  templateUrl: './snippet-web-view.component.html',
  styleUrl: './snippet-web-view.component.scss',
})
export class SnippetWebViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(SnippetPreviewComponent) previewComponent?: SnippetPreviewComponent;

  snippetStoreService = inject(SnippetStoreService);
  snippetSaveUIService = inject(SnippetSaveUIService);
  editorUi = inject(EditorUiService);

  private route = inject(ActivatedRoute);
  private authStoreService = inject(AuthStoreService);
  private destroyRef = inject(DestroyRef);

  get user() { return this.authStoreService.user; }
  get selectedLayout() { return this.editorUi.layout(); }

  snippetId: string | null = null;
  error: string | null = null;
  private viewRecorded = false;

  @HostListener('window:keydown.control.s', ['$event'])
  onSaveShortcut(event: Event) {
    event.preventDefault();
    this.snippetSaveUIService.saveSnippetWithUI(this.snippetStoreService, this.user);
  }

  constructor() {
    effect(() => {
      const snippet = this.snippetStoreService.snippet();
      const previewUpdateType = this.snippetStoreService.previewUpdateType();
      // Re-run when layout changes so preview remounts cleanly
      this.editorUi.layout();

      if (!previewUpdateType || !snippet?.snippetFiles) return;

      const htmlFile = snippet.snippetFiles.find(f => f.fileType === 'html');
      const cssFile = snippet.snippetFiles.find(f => f.fileType === 'css');
      const jsFile = snippet.snippetFiles.find(f => f.fileType === 'js');

      this.updatePreview(
        htmlFile?.content || '',
        cssFile?.content || '',
        jsFile?.content || '',
        previewUpdateType,
        snippet.externalResources || []
      );
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
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        this.snippetId = id;
        this.viewRecorded = false;
        this.error = null;

        if (id) {
          void this.snippetStoreService.loadSnippet(id);
        } else {
          this.snippetStoreService.clearSnippet();
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
          this.snippetStoreService.previewUpdateType.set('full');
          this.snippetStoreService.loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.snippetStoreService.clearSnippet();
  }

  private updatePreview(
    html: string,
    css: string,
    js: string,
    previewUpdateType: string | null,
    externalResources: ExternalResource[] = []
  ) {
    if (!this.previewComponent) {
      setTimeout(() => {
        if (this.previewComponent) {
          this.previewComponent.updatePreview(html, css, js, previewUpdateType, externalResources);
        }
      }, 100);
      return;
    }

    this.previewComponent.updatePreview(html, css, js, previewUpdateType, externalResources);
  }
}
