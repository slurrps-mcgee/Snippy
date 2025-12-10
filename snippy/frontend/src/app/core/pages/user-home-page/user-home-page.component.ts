import { AfterViewInit, Component, OnInit, effect, DestroyRef, inject } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { PageEvent } from '@angular/material/paginator';
import { AuthLocalService } from '../../../shared/services/auth.local.service';
import { SnippetService } from '../../../shared/services/snippet.service';
import { User } from '../../../shared/interfaces/user.interface';
import { SnippetList } from '../../../shared/interfaces/snippetList.interface';
import { SnippetListComponentComponent } from '../../../shared/components/snippet-list-component/snippet-list-component.component';
import {MatTabsModule} from '@angular/material/tabs';
import {MatDividerModule} from '@angular/material/divider';

@Component({
  selector: 'app-user-home-page',
  imports: [SnippetListComponentComponent, MatTabsModule, MatDividerModule],
  templateUrl: './user-home-page.component.html',
  styleUrl: './user-home-page.component.scss'
})
export class UserHomePageComponent implements OnInit {
  user$!: ReturnType<typeof toSignal<User | null>>;
  snippets: SnippetList[] = [];
  total: number = 0;
  pageSize: number = 6;
  pageIndex: number = 0;
  isLoading = false;
  searchQuery: string = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    public auth0Service: AuthService,
    private authLocalService: AuthLocalService,
    private snippetService: SnippetService
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }

  ngOnInit() {
    this.loadUserSnippets(this.pageIndex + 1, this.pageSize);
  }

  loadUserSnippets(page: number, limit: number) {
    this.isLoading = true;
    this.snippetService.getUserSnippets(page, limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.snippets = response.snippets;
          this.total = response.totalCount;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading user snippets:', error);
          this.snippets = [];
          this.total = 0;
          this.isLoading = false;
        }
      });
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
