import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { CollectionStoreService } from '../../../shared/services/store.services/collection.store.service';
import { SnackbarService } from '../../../shared/services/component.services/snackbar.service';
import { SnippetList } from '../../../shared/interfaces/snippetList.interface';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import { DialogService } from '../../../shared/services/component.services/dialog.service';
import { Debouncer } from '../../../shared/utils/debounce';
import { AsyncStateComponent } from '../../../shared/components/async-state/async-state.component';

@Component({
  selector: 'app-collection-detail-page',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    SnippetListComponentComponent,
    AsyncStateComponent,
  ],
  templateUrl: './collection-detail-page.component.html',
  styleUrl: './collection-detail-page.component.scss',
})
export class CollectionDetailPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);
  private collectionStoreService = inject(CollectionStoreService);
  private snackbarService = inject(SnackbarService);
  private dialogService = inject(DialogService);
  private searchDebouncer = new Debouncer();

  loading = signal(true);
  notFound = signal(false);
  searchQuery = signal('');

  private shortId = '';
  pageSize = 6;
  pageIndex = 0;

  get collection() {
    return this.collectionStoreService.activeCollection();
  }

  private allSnippets = computed<SnippetList[]>(() => this.collection?.snippets ?? []);

  get total() {
    return this.allSnippets().length;
  }

  get snippets(): SnippetList[] {
    const start = this.pageIndex * this.pageSize;
    return this.allSnippets().slice(start, start + this.pageSize);
  }

  get penCount(): number {
    return this.collection?.snippetCount ?? this.collection?.snippets?.length ?? 0;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const shortId = params.get('shortId');
        if (!shortId) return;
        this.shortId = shortId;
        this.pageIndex = 0;
        this.searchQuery.set('');
        this.load(shortId);
      });
  }

  ngOnDestroy() {
    this.searchDebouncer.clear();
  }

  async load(shortId: string, q?: string) {
    this.loading.set(true);
    this.notFound.set(false);
    try {
      await this.collectionStoreService.loadOne(shortId, q);
    } catch {
      this.notFound.set(true);
      this.snackbarService.error('Failed to load collection');
    } finally {
      this.loading.set(false);
    }
  }

  handleSearch(query: string) {
    this.searchQuery.set(query);
    this.pageIndex = 0;
    this.searchDebouncer.run(() => this.load(this.shortId, query.trim() || undefined));
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  async removeSnippet(snippet: SnippetList, event?: Event) {
    event?.stopPropagation();
    const collection = this.collection;
    if (!collection?.isOwner) return;

    const ok = await this.dialogService.confirm({
      title: 'Remove from collection',
      message: `Remove "${snippet.name}" from this collection? The snippet itself is not deleted.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    try {
      await this.collectionStoreService.removeSnippet(collection.collectionId, snippet.snippetId);
      this.snackbarService.success('Removed from collection');
    } catch {
      this.snackbarService.error('Failed to remove snippet');
    }
  }

  goBack() {
    this.location.back();
  }
}
