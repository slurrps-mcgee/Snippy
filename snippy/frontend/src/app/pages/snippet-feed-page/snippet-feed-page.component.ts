import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { SnippetSort } from '@app/services/api/snippet.api.service';
import { SnippetListComponent } from '@app/components/lists/snippet-list/snippet-list.component';
import { SortPageHeaderComponent } from '@app/components/headers/sort-page-header/sort-page-header.component';
import { AsyncStateComponent } from '@app/components/async-state/async-state.component';
import { ListPageState } from '@app/utils/list-page-state';

export type SnippetFeed = 'public' | 'following';

const FEED_TITLES: Record<SnippetFeed, string> = {
  public: 'Explore',
  following: 'Following',
};

/**
 * Backs both /public and /following; the route's `feed` data picks which store
 * loader and title to use.
 */
@Component({
  selector: 'app-snippet-feed-page',
  imports: [SnippetListComponent, SortPageHeaderComponent, AsyncStateComponent],
  templateUrl: './snippet-feed-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './snippet-feed-page.component.scss',
})
export class SnippetFeedPageComponent implements OnInit {
  private snippetStore = inject(SnippetStoreService);
  private route = inject(ActivatedRoute);

  feed: SnippetFeed = 'public';

  state = new ListPageState<SnippetSort>(() => this.load());

  get title() {
    return FEED_TITLES[this.feed];
  }

  get snippets() {
    return this.snippetStore.snippetList()?.snippets ?? [];
  }

  get total() {
    return this.snippetStore.snippetList()?.totalCount ?? 0;
  }

  get isLoading() {
    return this.snippetStore.loading();
  }

  ngOnInit() {
    this.feed = (this.route.snapshot.data['feed'] as SnippetFeed) ?? 'public';
    void this.load();
  }

  private async load() {
    const { page, pageSize, sort, query } = this.state;
    try {
      if (this.feed === 'following') {
        await this.snippetStore.loadFeedSnippets(page, pageSize, sort, query);
      } else {
        await this.snippetStore.loadPublicSnippets(page, pageSize, sort, query);
      }
    } catch (error) {
      console.error(`Error loading ${this.feed} snippets:`, error);
    }
  }
}
