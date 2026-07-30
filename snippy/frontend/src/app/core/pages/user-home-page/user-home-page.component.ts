import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import { CollectionListComponent } from '../../components/collection-list/collection-list.component';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { CollectionStoreService } from '../../../shared/services/store.services/collection.store.service';
import { CollectionCreateDialogComponent } from '../../../shared/components/dialogs/collection-create-dialog/collection-create-dialog.component';
import { SnackbarService } from '../../../shared/services/component.services/snackbar.service';
import { DialogService } from '../../../shared/services/component.services/dialog.service';
import { Debouncer } from '../../../shared/utils/debounce';
import { Collection } from '../../../shared/interfaces/collection.interface';
import { UserIdentityHeaderComponent } from '../../../shared/components/modules/user-identity-header/user-identity-header.component';
import { AsyncStateComponent } from '../../../shared/components/async-state/async-state.component';

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
    UserIdentityHeaderComponent,
    AsyncStateComponent,
  ],
  templateUrl: './user-home-page.component.html',
  styleUrl: './user-home-page.component.scss'
})
export class UserHomePageComponent implements OnInit, OnDestroy {
  private authStoreService = inject(AuthStoreService);
  private snippetStoreService = inject(SnippetStoreService);
  private collectionStore = inject(CollectionStoreService);
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  get user() { return this.authStoreService.user; }

  get snippets() { return this.snippetStoreService.snippetList()?.snippets ?? []; }
  get total() { return this.snippetStoreService.snippetList()?.totalCount ?? 0; }
  get isLoading() { return this.snippetStoreService.loading(); }

  get collections() { return this.collectionStore.collections(); }
  get collectionsTotal() { return this.collectionStore.totalCount(); }
  get collectionsLoading() { return this.collectionStore.loading(); }

  get favorites() { return this.snippetStoreService.favoritesList()?.snippets ?? []; }
  get favoritesTotal() { return this.snippetStoreService.favoritesList()?.totalCount ?? 0; }
  get favoritesLoading() { return this.snippetStoreService.favoritesLoading(); }

  pageSize = 6;
  pageIndex = 0;
  searchQuery = '';
  private searchDebouncer = new Debouncer();

  collectionPageSize = 6;
  collectionPageIndex = 0;
  collectionSearchQuery = '';
  private collectionSearchDebouncer = new Debouncer();

  favoritesPageSize = 6;
  favoritesPageIndex = 0;
  favoritesSearchQuery = '';
  private favoritesSearchDebouncer = new Debouncer();

  ngOnInit() {
    this.loadUserSnippets(this.pageIndex + 1, this.pageSize);
    this.collectionStore.loadMine(this.collectionPageIndex + 1, this.collectionPageSize);
    this.loadFavorites(this.favoritesPageIndex + 1, this.favoritesPageSize);
  }

  ngOnDestroy() {
    this.searchDebouncer.clear();
    this.collectionSearchDebouncer.clear();
    this.favoritesSearchDebouncer.clear();
  }

  async loadUserSnippets(page: number, limit: number) {
    try {
      await this.snippetStoreService.loadUserSnippets(page, limit, this.searchQuery.trim() || undefined);
    } catch (error) {
      console.error('Error loading user snippets:', error);
    }
  }

  async loadFavorites(page: number, limit: number) {
    try {
      await this.snippetStoreService.loadFavorites(page, limit, this.favoritesSearchQuery.trim() || undefined);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  handleSearch(searchQuery: string) {
    this.searchQuery = searchQuery;
    this.pageIndex = 0;
    this.searchDebouncer.run(() => this.loadUserSnippets(this.pageIndex + 1, this.pageSize));
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUserSnippets(event.pageIndex + 1, event.pageSize);
  }

  handleCollectionSearch(searchQuery: string) {
    this.collectionSearchQuery = searchQuery;
    this.collectionPageIndex = 0;
    this.collectionSearchDebouncer.run(() =>
      this.collectionStore.loadMine(
        this.collectionPageIndex + 1,
        this.collectionPageSize,
        undefined,
        this.collectionSearchQuery.trim() || undefined
      )
    );
  }

  handleCollectionPageChange(event: PageEvent) {
    this.collectionPageIndex = event.pageIndex;
    this.collectionPageSize = event.pageSize;
    void this.collectionStore.loadMine(
      event.pageIndex + 1,
      event.pageSize,
      undefined,
      this.collectionSearchQuery.trim() || undefined
    );
  }

  handleFavoritesSearch(searchQuery: string) {
    this.favoritesSearchQuery = searchQuery;
    this.favoritesPageIndex = 0;
    this.favoritesSearchDebouncer.run(() =>
      this.loadFavorites(this.favoritesPageIndex + 1, this.favoritesPageSize)
    );
  }

  handleFavoritesPageChange(event: PageEvent) {
    this.favoritesPageIndex = event.pageIndex;
    this.favoritesPageSize = event.pageSize;
    this.loadFavorites(event.pageIndex + 1, event.pageSize);
  }

  openCreateCollection() {
    this.dialogService.open(CollectionCreateDialogComponent, 'md');
  }

  openCollection(c: Collection) {
    this.router.navigate(['/collections', c.shortId]);
  }

  async deleteCollection(c: Collection) {
    const ok = await this.dialogService.confirm({
      title: 'Delete Collection',
      message: `Delete "${c.name}"? Snippets are not deleted.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    try {
      await this.collectionStore.delete(c.collectionId);
      this.snackbar.success('Collection deleted');
    } catch {
      this.snackbar.error('Failed to delete collection');
    }
  }
}
