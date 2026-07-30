import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserMenuComponent } from '../../modules/user-menu/user-menu.component';
import { HeaderMode } from '../../../../app.routes';
import { SnippetStoreService } from '../../../services/store.services/snippet.store.service';
import { AuthStoreService } from '../../../services/store.services/authStore.service';
import { SnippetSaveUIService } from '../../../services/communication/snippet-save-ui.service';
import { EditorLayout, EditorUiService } from '../../../services/communication/editor-ui.service';
import { SnippetSettingsDialogComponent } from '../../dialogs/snippet-settings-dialog/snippet-settings-dialog.component';
import { CommentDialogComponent } from '../../dialogs/comment-dialog/comment-dialog.component';
import { SnackbarService } from '../../../services/component.services/snackbar.service';

@Component({
  selector: 'app-page-header',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatTooltipModule,
    UserMenuComponent,
  ],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private auth0 = inject(AuthService);
  private authStore = inject(AuthStoreService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);

  snippetStore = inject(SnippetStoreService);
  snippetSaveUI = inject(SnippetSaveUIService);
  editorUi = inject(EditorUiService);

  mode: HeaderMode = 'landing';
  /** -1 means no feed tab is active (profile / settings / collection). */
  selectedPageIndex = -1;

  get user() {
    return this.authStore.user;
  }

  get canEdit(): boolean {
    const s = this.snippetStore.snippet();
    return !!s && (s.isOwner || !s.snippetId);
  }

  get hasSavedSnippet(): boolean {
    return !!this.snippetStore.snippet()?.snippetId;
  }

  ngOnInit() {
    this.syncFromRouter();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncFromRouter());
  }

  private syncFromRouter() {
    this.mode = this.resolveHeaderMode();
    this.updateTabFromRoute(this.router.url);
  }

  private resolveHeaderMode(): HeaderMode {
    let current: ActivatedRoute | null = this.route;
    while (current?.firstChild) {
      current = current.firstChild;
    }
    const fromData = current?.snapshot.data?.['header'] as HeaderMode | undefined;
    if (fromData) return fromData;

    const url = this.router.url.split('?')[0];
    if (url === '/' || url === '') return 'landing';
    if (url === '/snippet' || /\/snippet\//.test(url)) return 'editor';
    if (/\/fullpage\//.test(url)) return 'minimal';
    return 'feed';
  }

  private updateTabFromRoute(url: string) {
    if (url.startsWith('/home')) {
      this.selectedPageIndex = 0;
    } else if (url.startsWith('/following')) {
      this.selectedPageIndex = 1;
    } else if (url.startsWith('/public')) {
      this.selectedPageIndex = 2;
    } else {
      this.selectedPageIndex = -1;
    }
  }

  onPageTabChange(index: number) {
    if (index === 0) {
      this.router.navigate(['/home']);
    } else if (index === 1) {
      this.router.navigate(['/following']);
    } else if (index === 2) {
      this.router.navigate(['/public']);
    }
  }

  login() {
    this.auth0.loginWithRedirect({ appState: { target: '/home' } });
  }

  onSnippetNameChange(name: string) {
    this.snippetStore.updateSnippetName(name);
  }

  onLayoutChange(layout: EditorLayout) {
    this.editorUi.setLayout(layout);
    this.snippetStore.previewUpdateType.set('full');
  }

  openSettings() {
    const snippet = this.snippetStore.snippet();
    if (!snippet || !this.canEdit) return;

    const dialogRef = this.dialog.open(SnippetSettingsDialogComponent, {
      width: '50vw',
      height: '80vh',
      maxWidth: '50vw',
      maxHeight: '80vh',
      data: snippet,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snippetStore.updateSnippetSettings(result);
          this.snippetSaveUI.saveSnippetWithUI(this.snippetStore, this.user);
        }
      });
  }

  viewFullPage() {
    const snippet = this.snippetStore.snippet();
    if (!snippet?.shortId) return;
    const user = snippet.userName || this.user()?.userName || 'me';
    window.open(`/${user}/fullpage/${snippet.shortId}`, '_blank');
  }

  async toggleFavorite() {
    const snippet = this.snippetStore.snippet();
    if (!snippet?.snippetId) return;
    try {
      await this.snippetStore.favoriteSnippet(snippet.snippetId);
    } catch {
      this.snackbar.error('Failed to update favorite');
    }
  }

  openComments() {
    const snippet = this.snippetStore.snippet();
    if (!snippet?.snippetId) return;
    this.dialog.open(CommentDialogComponent, {
      width: '560px',
      maxHeight: '85vh',
      data: {
        snippetId: snippet.snippetId,
        snippetName: snippet.name,
        snippetDescription: snippet.description,
        ownerUserName: snippet.userName || this.user()?.userName,
        isSnippetOwner: snippet.isOwner,
      },
    });
  }

  async forkSnippet() {
    const snippet = this.snippetStore.snippet();
    if (!snippet?.snippetId) return;
    try {
      const res = await this.snippetStore.forkSnippet(snippet.snippetId);
      this.snackbar.success('Snippet forked');
      const user = this.user()?.userName || res.snippet.userName || 'me';
      this.router.navigate([user, 'snippet', res.snippet.shortId]);
    } catch {
      this.snackbar.error('Failed to fork snippet');
    }
  }
}
