import { Component, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { SnippetSort } from '../../../shared/services/api.services/snippet.api.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';

@Component({
  selector: 'app-following-page',
  imports: [MatFormFieldModule, MatSelectModule, SnippetListComponentComponent],
  templateUrl: './following-page.component.html',
  styleUrl: './following-page.component.scss',
})
export class FollowingPageComponent implements OnInit {
  private snippetStoreService = inject(SnippetStoreService);

  readonly sortOptions: { value: SnippetSort; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'favorites', label: 'Most Favorited' },
    { value: 'forks', label: 'Most Forked' },
  ];

  searchQuery = '';

  get allSnippets() {
    return this.snippetStoreService.snippetList()?.snippets ?? [];
  }

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

  get isLoading() {
    return this.snippetStoreService.loading();
  }

  pageSize = 6;
  pageIndex = 0;
  sort: SnippetSort = 'newest';

  ngOnInit() {
    this.loadFeed();
  }

  async loadFeed() {
    try {
      await this.snippetStoreService.loadFeedSnippets(this.pageIndex + 1, this.pageSize, this.sort);
    } catch (error) {
      console.error('Error loading feed snippets:', error);
    }
  }

  handleSortChange(sort: SnippetSort) {
    this.sort = sort;
    this.pageIndex = 0;
    this.searchQuery = '';
    this.loadFeed();
  }

  handleSearch(searchQuery: string) {
    this.searchQuery = searchQuery;
    this.pageIndex = 0;
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.searchQuery = '';
    this.loadFeed();
  }
}
