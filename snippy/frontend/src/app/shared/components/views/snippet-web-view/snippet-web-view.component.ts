import { Component, ViewChild, ElementRef, effect, AfterViewInit, OnInit, OnDestroy, inject, DestroyRef, HostListener } from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { CommonModule } from '@angular/common';
import { SnippetEditorComponent } from '../../../../core/components/snippet-editor/snippet-editor.component';
import { SnippetPreviewComponent } from '../../../../core/components/snippet-preview/snippet-preview.component';
import { Snippet } from '../../../interfaces/snippet.interface';
import { SnippetStoreService } from '../../../services/store.services/snippet.store.service';
import { ExternalResource } from '../../../interfaces/externalResource.interface';
import { SnippetSettingsDialogComponent } from '../../dialogs/snippet-settings-dialog/snippet-settings-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { SnippetSaveUIService } from '../../../services/communication/snippet-save-ui.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthStoreService } from '../../../services/store.services/authStore.service';
import { MatDialog } from '@angular/material/dialog';
import { UserMenuComponent } from '../../modules/user-menu/user-menu.component';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// ...existing imports...

@Component({
  selector: 'app-snippet-web-view',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AngularSplitModule,
    SnippetEditorComponent,
    SnippetPreviewComponent,
    UserMenuComponent,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonToggleModule
  ],
  templateUrl: './snippet-web-view.component.html',
  styleUrl: './snippet-web-view.component.scss',
})
export class SnippetWebViewComponent implements OnInit, AfterViewInit, OnDestroy {
  // Reference to the preview component
  @ViewChild(SnippetPreviewComponent) previewComponent?: SnippetPreviewComponent;

  snippetStoreService = inject(SnippetStoreService);
  auth0Service = inject(AuthService);
  snippetSaveUIService = inject(SnippetSaveUIService);

  private route = inject(ActivatedRoute);
  private authStoreService = inject(AuthStoreService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  // Use signal directly from AuthStore
  get user() { return this.authStoreService.user; }
  snippetId: string | null = null;
  error: string | null = null;
  selectedLayout: 'top' | 'bottom' | 'left' | 'right' = 'top';

  // Window Shortcuts
  @HostListener('window:keydown.control.s', ['$event'])
  onSaveShortcut(event: Event) {
    event.preventDefault();
    this.snippetSaveUIService.saveSnippetWithUI(this.snippetStoreService, this.user);
  }

  constructor() {
    // Watch snippet state service for code changes and update preview
    effect(() => {
      const snippet = this.snippetStoreService.snippet();
      const previewUpdateType = this.snippetStoreService.previewUpdateType();

      // Only update preview if a code file actually changed
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
  }

  ngAfterViewInit() {
    // Initial preview update handled by effect
  }

  ngOnInit(): void {
    // Load saved layout preference
    const savedLayout = localStorage.getItem('editorLayout') as 'top' | 'bottom' | 'left' | 'right';
    if (savedLayout) {
      this.selectedLayout = savedLayout;
    }

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
      this.snippetStoreService.previewUpdateType.set('full');
      this.snippetStoreService.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.snippetStoreService.clearSnippet();
  }

  onSnippetNameChange(newName: string) {
    this.snippetStoreService.updateSnippetName(newName);
  }

  onLayoutChange(newLayout: 'top' | 'bottom' | 'left' | 'right') {
    this.selectedLayout = newLayout;
    localStorage.setItem('editorLayout', newLayout);

    // Refresh preview after layout change
    setTimeout(() => {
      const snippet = this.snippetStoreService.snippet();
      if (!snippet?.snippetFiles) return;

      const htmlFile = snippet.snippetFiles.find(f => f.fileType === 'html');
      const cssFile = snippet.snippetFiles.find(f => f.fileType === 'css');
      const jsFile = snippet.snippetFiles.find(f => f.fileType === 'js');

      this.updatePreview(
        htmlFile?.content || '',
        cssFile?.content || '',
        jsFile?.content || '',
        'full',
        snippet.externalResources || []
      );
    }, 0);
  }

  openSettings() {
    const snippet = this.snippetStoreService.snippet();
    if (!snippet) return;

    const dialogRef = this.dialog.open(SnippetSettingsDialogComponent, {
      width: '50vw',
      height: '80vh',
      maxWidth: '50vw',
      maxHeight: '80vh',
      data: snippet
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snippetStoreService.updateSnippetSettings(result);
          // Automatically save after updating settings
          this.snippetSaveUIService.saveSnippetWithUI(this.snippetStoreService, this.user);
        }
      });
  }

  viewFullPage() {
    const snippet = this.snippetStoreService.snippet();
    if (!snippet) return;

    // Navigate to full page view route
    window.open(`/${snippet.displayName}/fullpage/${snippet.shortId}`, '_blank');
  }

  // Update preview by passing code to preview component
  private updatePreview(html: string, css: string, js: string, previewUpdateType: string | null, externalResources: ExternalResource[] = []) {
    if (!this.previewComponent) {
      // If preview component not ready, retry after a short delay
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