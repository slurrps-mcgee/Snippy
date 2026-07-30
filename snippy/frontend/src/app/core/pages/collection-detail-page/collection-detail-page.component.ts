import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { CollectionStoreService } from '../../../shared/services/store.services/collection.store.service';
import { SnackbarService } from '../../../shared/services/component.services/snackbar.service';
import { SnippetList } from '../../../shared/interfaces/snippetList.interface';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import { ConfirmDialogComponent } from '../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-collection-detail-page',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    SnippetListComponentComponent,
  ],
  templateUrl: './collection-detail-page.component.html',
  styleUrl: './collection-detail-page.component.scss',
})
export class CollectionDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);
  private collectionStoreService = inject(CollectionStoreService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  notFound = signal(false);
  searchQuery = signal('');

  pageSize = 6;
  pageIndex = 0;

  get collection() {
    return this.collectionStoreService.activeCollection();
  }

  private filteredSnippets = computed<SnippetList[]>(() => {
    const all = this.collection?.snippets ?? [];
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return all;
    return all.filter(s =>
      s.name?.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query)
    );
  });

  get total() {
    return this.filteredSnippets().length;
  }

  get snippets(): SnippetList[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredSnippets().slice(start, start + this.pageSize);
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
        this.pageIndex = 0;
        this.load(shortId);
      });
  }

  async load(shortId: string) {
    this.loading.set(true);
    this.notFound.set(false);
    try {
      await this.collectionStoreService.loadOne(shortId);
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
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  removeSnippet(snippet: SnippetList, event?: Event) {
    event?.stopPropagation();
    const collection = this.collection;
    if (!collection?.isOwner) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove from collection',
        message: `Remove "${snippet.name}" from this collection? The snippet itself is not deleted.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async ok => {
      if (!ok) return;
      try {
        await this.collectionStoreService.removeSnippet(collection.collectionId, snippet.snippetId);
        this.snackbarService.success('Removed from collection');
      } catch {
        this.snackbarService.error('Failed to remove snippet');
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
