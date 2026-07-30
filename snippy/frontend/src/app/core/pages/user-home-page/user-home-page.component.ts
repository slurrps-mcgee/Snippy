import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import { CollectionListComponent } from '../../components/collection-list/collection-list.component';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { CollectionStoreService } from '../../../shared/services/store.services/collection.store.service';
import { CollectionCreateDialogComponent } from '../../../shared/components/dialogs/collection-create-dialog/collection-create-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../shared/services/component.services/snackbar.service';
import { Collection } from '../../../shared/interfaces/collection.interface';

@Component({
  selector: 'app-user-home-page',
  imports: [
    CommonModule,
    SnippetListComponentComponent,
    CollectionListComponent,
    MatTabsModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './user-home-page.component.html',
  styleUrl: './user-home-page.component.scss'
})
export class UserHomePageComponent implements OnInit {
  private authStoreService = inject(AuthStoreService);
  private snippetStoreService = inject(SnippetStoreService);
  private collectionStore = inject(CollectionStoreService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  get user() { return this.authStoreService.user; }

  get allSnippets() { return this.snippetStoreService.snippetList()?.snippets ?? []; }
  get snippets() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.allSnippets;
    return this.allSnippets.filter(s =>
      s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  }
  get total() {
    if (this.searchQuery.trim()) return this.snippets.length;
    return this.snippetStoreService.snippetList()?.totalCount ?? 0;
  }
  get isLoading() { return this.snippetStoreService.loading(); }

  get allCollections() { return this.collectionStore.collections(); }
  get collections() {
    const q = this.collectionSearchQuery.trim().toLowerCase();
    if (!q) return this.allCollections;
    return this.allCollections.filter(c =>
      c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }
  get collectionsTotal() {
    if (this.collectionSearchQuery.trim()) return this.collections.length;
    return this.collectionStore.totalCount();
  }
  get collectionsLoading() { return this.collectionStore.loading(); }

  get allFavorites() { return this.snippetStoreService.favoritesList()?.snippets ?? []; }
  get favorites() {
    const q = this.favoritesSearchQuery.trim().toLowerCase();
    if (!q) return this.allFavorites;
    return this.allFavorites.filter(s =>
      s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  }
  get favoritesTotal() {
    if (this.favoritesSearchQuery.trim()) return this.favorites.length;
    return this.snippetStoreService.favoritesList()?.totalCount ?? 0;
  }
  get favoritesLoading() { return this.snippetStoreService.favoritesLoading(); }

  pageSize = 6;
  pageIndex = 0;
  searchQuery = '';

  collectionPageSize = 6;
  collectionPageIndex = 0;
  collectionSearchQuery = '';

  favoritesPageSize = 6;
  favoritesPageIndex = 0;
  favoritesSearchQuery = '';

  ngOnInit() {
    this.loadUserSnippets(this.pageIndex + 1, this.pageSize);
    this.collectionStore.loadMine();
    this.loadFavorites(this.favoritesPageIndex + 1, this.favoritesPageSize);
  }

  async loadUserSnippets(page: number, limit: number) {
    try {
      await this.snippetStoreService.loadUserSnippets(page, limit);
    } catch (error) {
      console.error('Error loading user snippets:', error);
    }
  }

  async loadFavorites(page: number, limit: number) {
    try {
      await this.snippetStoreService.loadFavorites(page, limit);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  handleSearch(searchQuery: string) {
    this.searchQuery = searchQuery;
    this.pageIndex = 0;
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.searchQuery = '';
    this.loadUserSnippets(event.pageIndex + 1, event.pageSize);
  }

  handleCollectionSearch(searchQuery: string) {
    this.collectionSearchQuery = searchQuery;
    this.collectionPageIndex = 0;
  }

  handleCollectionPageChange(event: PageEvent) {
    this.collectionPageIndex = event.pageIndex;
    this.collectionPageSize = event.pageSize;
    this.collectionSearchQuery = '';
    void this.collectionStore.loadMine(event.pageIndex + 1, event.pageSize);
  }

  handleFavoritesSearch(searchQuery: string) {
    this.favoritesSearchQuery = searchQuery;
    this.favoritesPageIndex = 0;
  }

  handleFavoritesPageChange(event: PageEvent) {
    this.favoritesPageIndex = event.pageIndex;
    this.favoritesPageSize = event.pageSize;
    this.favoritesSearchQuery = '';
    this.loadFavorites(event.pageIndex + 1, event.pageSize);
  }

  openCreateCollection() {
    const ref = this.dialog.open(CollectionCreateDialogComponent, { width: '480px' });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  openCollection(c: Collection) {
    this.router.navigate(['/collections', c.shortId]);
  }

  async deleteCollection(c: Collection) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Collection',
        message: `Delete "${c.name}"? Snippets are not deleted.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (ok) => {
      if (!ok) return;
      try {
        await this.collectionStore.delete(c.collectionId);
        this.snackbar.success('Collection deleted');
      } catch {
        this.snackbar.error('Failed to delete collection');
      }
    });
  }
}
