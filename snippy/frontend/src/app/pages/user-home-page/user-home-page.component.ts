import { Component, OnInit, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthStoreService } from '@app/services/stores/auth.store.service';
import { SnippetListComponent } from '@app/components/lists/snippet-list/snippet-list.component';
import { CollectionListComponent } from '@app/components/lists/collection-list/collection-list.component';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { CollectionStoreService } from '@app/services/stores/collection.store.service';
import { CollectionCreateDialogComponent } from '@app/components/dialogs/collection-create-dialog/collection-create-dialog.component';
import { DialogService } from '@app/services/ui/dialog.service';
import { NavigationService } from '@app/services/ui/navigation.service';
import { Collection } from '@app/interfaces/collection.interface';
import { UserIdentityHeaderComponent } from '@app/components/modules/user-identity-header/user-identity-header.component';
import { AsyncStateComponent } from '@app/components/async-state/async-state.component';
import { ListPageState } from '@app/utils/list-page-state';

@Component({
  selector: 'app-user-home-page',
  imports: [
    CommonModule,
    SnippetListComponent,
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
export class UserHomePageComponent implements OnInit {
  private authStoreService = inject(AuthStoreService);
  private snippetStoreService = inject(SnippetStoreService);
  private collectionStore = inject(CollectionStoreService);
  private dialogService = inject(DialogService);
  private navigation = inject(NavigationService);

  snippetState = new ListPageState(() => this.loadUserSnippets());
  collectionState = new ListPageState(() => this.loadCollections());
  favoritesState = new ListPageState(() => this.loadFavorites());

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

  ngOnInit() {
    void this.loadUserSnippets();
    void this.loadCollections();
    void this.loadFavorites();
  }

  private async loadUserSnippets() {
    const { page, pageSize, query } = this.snippetState;
    try {
      await this.snippetStoreService.loadUserSnippets(page, pageSize, query);
    } catch (error) {
      console.error('Error loading user snippets:', error);
    }
  }

  private async loadCollections() {
    const { page, pageSize, query } = this.collectionState;
    try {
      await this.collectionStore.loadMine(page, pageSize, undefined, query);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }

  private async loadFavorites() {
    const { page, pageSize, query } = this.favoritesState;
    try {
      await this.snippetStoreService.loadFavorites(page, pageSize, query);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  openCreateCollection() {
    this.dialogService.open(CollectionCreateDialogComponent, 'md');
  }

  openCollection(c: Collection) {
    this.navigation.toCollection(c.shortId);
  }

  deleteCollection(c: Collection) {
    return this.dialogService.confirmAndRun({
      confirm: {
        title: 'Delete Collection',
        message: `Delete "${c.name}"? Snippets are not deleted.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      action: () => this.collectionStore.delete(c.collectionId),
      success: 'Collection deleted',
      error: 'Failed to delete collection',
    });
  }
}
