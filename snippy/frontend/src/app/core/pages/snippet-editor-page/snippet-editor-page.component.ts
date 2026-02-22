import { Component, OnInit, ViewChild, OnDestroy, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { SnippetWebViewComponent } from "../../../shared/components/views/snippet-web-view/snippet-web-view.component";
import { HostListener } from '@angular/core';
import { SnippetSaveUIService } from '../../../shared/services/communication/snippet-save-ui.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SnippetSettingsDialogComponent } from '../../../shared/components/dialogs/snippet-settings-dialog/snippet-settings-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@auth0/auth0-angular';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { UserMenuComponent } from "../../../shared/components/modules/user-menu/user-menu.component";

@Component({
  selector: 'app-snippet-editor-page',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    FormsModule,
    SnippetWebViewComponent,
    UserMenuComponent
],
  templateUrl: './snippet-editor-page.component.html',
  styleUrl: './snippet-editor-page.component.scss'
})
export class SnippetEditorPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: SnippetWebViewComponent;

  auth0Service = inject(AuthService);
  snippetStoreService = inject(SnippetStoreService);
  snippetSaveUIService = inject(SnippetSaveUIService);

  private route = inject(ActivatedRoute);
  private authStoreService = inject(AuthStoreService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

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

  onSnippetNameChange(newName: string) {
    this.snippetStoreService.updateSnippetName(newName);
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
}
