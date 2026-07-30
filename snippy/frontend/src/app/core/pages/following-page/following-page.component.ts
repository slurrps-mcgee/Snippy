import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { SnippetSort } from '../../../shared/services/api.services/snippet.api.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import { Debouncer } from '../../../shared/utils/debounce';
import { SortPageHeaderComponent } from '../../../shared/components/headers/sort-page-header/sort-page-header.component';
import { AsyncStateComponent } from '../../../shared/components/async-state/async-state.component';

@Component({
  selector: 'app-following-page',
  imports: [SnippetListComponentComponent, SortPageHeaderComponent, AsyncStateComponent],
  templateUrl: './following-page.component.html',
  styleUrl: './following-page.component.scss',
})
export class FollowingPageComponent implements OnInit, OnDestroy {
  private snippetStoreService = inject(SnippetStoreService);
  private searchDebouncer = new Debouncer();

  searchQuery = '';

  get snippets() {
    return this.snippetStoreService.snippetList()?.snippets ?? [];
  }

  get total() {
    return this.snippetStoreService.snippetList()?.totalCount ?? 0;
  }

  get isLoading() {
    return this.snippetStoreService.loading();
  }

  pageSize = 6;
  pageIndex = 0;
  sort: SnippetSort = 'newest';

  ngOnInit() {
    this.loadFeed();
  }

  ngOnDestroy() {
    this.searchDebouncer.clear();
  }

  async loadFeed() {
    try {
      await this.snippetStoreService.loadFeedSnippets(
        this.pageIndex + 1,
        this.pageSize,
        this.sort,
        this.searchQuery.trim() || undefined
      );
    } catch (error) {
      console.error('Error loading feed snippets:', error);
    }
  }

  handleSortChange(sort: SnippetSort) {
    this.sort = sort;
    this.pageIndex = 0;
    this.loadFeed();
  }

  handleSearch(searchQuery: string) {
    this.searchQuery = searchQuery;
    this.pageIndex = 0;
    this.searchDebouncer.run(() => this.loadFeed());
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadFeed();
  }
}
