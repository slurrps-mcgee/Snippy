import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { SnippetSort } from '../../../shared/services/api.services/snippet.api.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';

const SEARCH_DEBOUNCE_MS = 400;

@Component({
  selector: 'app-public-page',
  imports: [MatFormFieldModule, MatSelectModule, SnippetListComponentComponent],
  templateUrl: './public-page.component.html',
  styleUrl: './public-page.component.scss',
})
export class PublicPageComponent implements OnInit, OnDestroy {
  private snippetStoreService = inject(SnippetStoreService);
  private searchDebounceHandle?: ReturnType<typeof setTimeout>;

  readonly sortOptions: { value: SnippetSort; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'favorites', label: 'Most Favorited' },
    { value: 'forks', label: 'Most Forked' },
  ];

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
    clearTimeout(this.searchDebounceHandle);
  }

  async load() {
    try {
      const query = this.searchQuery.trim();
      if (query) {
        await this.snippetStoreService.searchSnippets(query, this.pageIndex + 1, this.pageSize, this.sort);
      } else {
        await this.snippetStoreService.loadPublicSnippets(this.pageIndex + 1, this.pageSize, this.sort);
      }
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
    clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => this.load(), SEARCH_DEBOUNCE_MS);
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }
}
