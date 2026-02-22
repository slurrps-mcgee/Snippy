import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { PageEvent } from '@angular/material/paginator';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import {MatTabsModule} from '@angular/material/tabs';
import {MatDividerModule} from '@angular/material/divider';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { PageHeaderComponent } from "../../../shared/components/headers/page-header/page-header.component";

@Component({
  selector: 'app-user-home-page',
  imports: [SnippetListComponentComponent, MatTabsModule, MatDividerModule, PageHeaderComponent],
  templateUrl: './user-home-page.component.html',
  styleUrl: './user-home-page.component.scss'
})

export class UserHomePageComponent implements OnInit {

  auth0Service = inject(AuthService);
  private authStoreService = inject(AuthStoreService);
  private snippetStoreService = inject(SnippetStoreService);

  get user() { return this.authStoreService.user; }

  get snippets() {
    return this.snippetStoreService.snippetList()?.snippets ?? [];
  }

  get total() {
    return this.snippetStoreService.snippetList()?.totalCount ?? 0;
  }
  
  get isLoading() {
    return this.snippetStoreService.loading();
  }

  pageSize: number = 6;
  pageIndex: number = 0;
  searchQuery: string = '';

  ngOnInit() {
    this.loadUserSnippets(this.pageIndex + 1, this.pageSize);
  }

  async loadUserSnippets(page: number, limit: number) {
    try {
      await this.snippetStoreService.loadUserSnippets(page, limit);
    } catch (error) {
      console.error('Error loading user snippets:', error);
    }
  }

  handleSearch(searchQuery: string) {
    this.searchQuery = searchQuery;
    this.pageIndex = 0;
    // TODO: Implement server-side search
    // this.loadUserSnippets(1, this.pageSize, searchQuery);
  }

  handlePageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUserSnippets(event.pageIndex + 1, event.pageSize);
  }
}
