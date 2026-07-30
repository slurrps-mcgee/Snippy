import { Component, Input, Output, EventEmitter, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Router, RouterModule } from '@angular/router';
import { SnippetList } from '../../../shared/interfaces/snippetList.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '../../../shared/services/component.services/snackbar.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogComponent } from '../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { FollowApiService } from '../../../shared/services/api.services/follow.api.service';
import { CommentDialogComponent } from '../../../shared/components/dialogs/comment-dialog/comment-dialog.component';
import { AddToCollectionDialogComponent } from '../../../shared/components/dialogs/add-to-collection-dialog/add-to-collection-dialog.component';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-snippet-list-component',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './snippet-list-component.component.html',
  styleUrl: './snippet-list-component.component.scss',
})
export class SnippetListComponentComponent {
  @Input() snippets: SnippetList[] = [];
  @Input() total: number = 0;
  @Input() pageSize: number = 6;
  @Input() pageIndex: number = 0;
  @Input() showNewButton = true;
  @Input() showRemoveFromCollection = false;
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() removeFromCollection = new EventEmitter<SnippetList>();

  searchQuery = '';

  private router = inject(Router);
  private snippetStoreService = inject(SnippetStoreService);
  private followApi = inject(FollowApiService);
  private authStore = inject(AuthStoreService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  onSearchChange() {
    this.searchChange.emit(this.searchQuery);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  openSnippet(snippet: SnippetList) {
    const user = snippet.userName || this.authStore.user()?.userName || 'me';
    this.router.navigate([user, 'snippet', snippet.shortId]);
  }

  goToProfile(snippet: SnippetList, event: Event) {
    event.stopPropagation();
    if (snippet.userName) {
      this.router.navigate(['/', snippet.userName]);
    }
  }

  createNewSnippet() {
    this.router.navigate(['snippet']);
  }

  async favoriteSnippet(snippet: SnippetList, event?: Event) {
    if (event) event.stopPropagation();

    const previousFavorited = !!snippet.isFavorited;
    const previousCount = snippet.favoriteCount;

    snippet.isFavorited = !previousFavorited;
    snippet.favoriteCount += previousFavorited ? -1 : 1;

    try {
      const response = await this.snippetStoreService.favoriteSnippet(snippet.snippetId);
      if (response) {
        snippet.isFavorited = response.isFavorited;
        snippet.favoriteCount = response.favoriteCount;
      }
    } catch {
      snippet.isFavorited = previousFavorited;
      snippet.favoriteCount = previousCount;
      this.snackbarService.error(`Failed to favorite snippet`);
    }
  }

  commentOnSnippet(snippet: SnippetList, event?: Event) {
    if (event) event.stopPropagation();
    this.dialog.open(CommentDialogComponent, {
      width: '560px',
      maxHeight: '85vh',
      data: {
        snippetId: snippet.snippetId,
        snippetName: snippet.name,
        snippetDescription: snippet.description,
        ownerUserName: snippet.userName,
        isSnippetOwner: snippet.isOwner,
      },
    });
  }

  addToCollection(snippet: SnippetList, event?: Event) {
    if (event) event.stopPropagation();
    this.dialog.open(AddToCollectionDialogComponent, {
      width: '420px',
      data: { snippetId: snippet.snippetId },
    });
  }

  async forkSnippet(snippet: SnippetList, event?: Event) {
    if (event) event.stopPropagation();
    try {
      const res = await this.snippetStoreService.forkSnippet(snippet.snippetId);
      const forked = res.snippet;
      this.snackbarService.success('Snippet forked');
      const user = this.authStore.user()?.userName || forked.userName || 'me';
      this.router.navigate([user, 'snippet', forked.shortId]);
    } catch {
      this.snackbarService.error('Failed to fork snippet');
    }
  }

  async toggleFollow(snippet: SnippetList, event?: Event) {
    if (event) event.stopPropagation();
    if (!snippet.userName || snippet.isOwner) return;
    try {
      const res = snippet.isFollowing
        ? await firstValueFrom(this.followApi.unfollow(snippet.userName))
        : await firstValueFrom(this.followApi.follow(snippet.userName));
      snippet.isFollowing = res.isFollowing ?? !snippet.isFollowing;
      this.snackbarService.success(
        snippet.isFollowing ? `Followed @${snippet.userName}` : `Unfollowed @${snippet.userName}`
      );
    } catch {
      this.snackbarService.error('Follow action failed');
    }
  }

  emitRemoveFromCollection(snippet: SnippetList, event?: Event) {
    if (event) event.stopPropagation();
    this.removeFromCollection.emit(snippet);
  }

  deleteSnippet(snippet: SnippetList, event?: Event) {
    if (event) event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Snippet',
        message: `Delete "${snippet.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async result => {
      if (result) {
        try {
          await this.snippetStoreService.deleteSnippet(snippet.snippetId);
          this.snackbarService.success('Snippet deleted');
        } catch {
          this.snackbarService.error('Failed to delete snippet');
        }
      }
    });
  }
}
