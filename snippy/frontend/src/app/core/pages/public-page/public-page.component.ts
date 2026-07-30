import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { SnippetSort } from '../../../shared/services/api.services/snippet.api.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import { Debouncer } from '../../../shared/utils/debounce';
import { SortPageHeaderComponent } from '../../../shared/components/headers/sort-page-header/sort-page-header.component';
import { AsyncStateComponent } from '../../../shared/components/async-state/async-state.component';

@Component({
  selector: 'app-public-page',
  imports: [SnippetListComponentComponent, SortPageHeaderComponent, AsyncStateComponent],
  templateUrl: './public-page.component.html',
  styleUrl: './public-page.component.scss',
})
export class PublicPageComponent implements OnInit, OnDestroy {
  private snippetStoreService = inject(SnippetStoreService);
  private searchDebouncer = new Debouncer();

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
  searchQuery = '';

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.searchDebouncer.clear();
  }

  async load() {
    try {
      await this.snippetStoreService.loadPublicSnippets(
        this.pageIndex + 1,
        this.pageSize,
        this.sort,
        this.searchQuery.trim() || undefined
      );
    } catch (error) {
      console.error('Error loading public snippets:', error);
    }
  }

  handleSortChange(sort: SnippetSort) {
    this.sort = sort;
    this.pageIndex = 0;
    this.load();
  }

  handleSearch(searchQuery: string) {
    this.searchQuery = searchQuery;
    this.pageIndex = 0;
    this.searchDebouncer.run(() => this.load());
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }
}
