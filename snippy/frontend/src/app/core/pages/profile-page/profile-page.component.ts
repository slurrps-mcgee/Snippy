import { Component, DestroyRef, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageEvent } from '@angular/material/paginator';
import { User } from '../../../shared/interfaces/user.interface';
import { Collection } from '../../../shared/interfaces/collection.interface';
import { UserApiService } from '../../../shared/services/api.services/user.api.service';
import { FollowApiService } from '../../../shared/services/api.services/follow.api.service';
import { AuthStoreService } from '../../../shared/services/store.services/authStore.service';
import { SnippetStoreService } from '../../../shared/services/store.services/snippet.store.service';
import { CollectionStoreService } from '../../../shared/services/store.services/collection.store.service';
import { SnackbarService } from '../../../shared/services/component.services/snackbar.service';
import { SnippetListComponentComponent } from '../../components/snippet-list-component/snippet-list-component.component';
import { CollectionListComponent } from '../../components/collection-list/collection-list.component';
import { Debouncer } from '../../../shared/utils/debounce';
import { UserIdentityHeaderComponent } from '../../../shared/components/modules/user-identity-header/user-identity-header.component';
import { AsyncStateComponent } from '../../../shared/components/async-state/async-state.component';

@Component({
  selector: 'app-profile-page',
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SnippetListComponentComponent,
    CollectionListComponent,
    UserIdentityHeaderComponent,
    AsyncStateComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private userApiService = inject(UserApiService);
  private followApiService = inject(FollowApiService);
  private authStoreService = inject(AuthStoreService);
  private snippetStoreService = inject(SnippetStoreService);
  private collectionStoreService = inject(CollectionStoreService);
  private snackbarService = inject(SnackbarService);

  profileUser = signal<User | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  followLoading = signal(false);

  isSelf = computed(() => {
    const current = this.authStoreService.user();
    const profile = this.profileUser();
    return !!current && !!profile && current.userName === profile.userName;
  });

  private username = '';
  pageSize = 6;
  pageIndex = 0;
  penSearchQuery = '';
  private penSearchDebouncer = new Debouncer();

  get snippets() {
    return this.snippetStoreService.snippetList()?.snippets ?? [];
  }

  get total() {
    return this.snippetStoreService.snippetList()?.totalCount ?? 0;
  }

  get isLoadingPens() {
    return this.snippetStoreService.loading();
  }

  get collections(): Collection[] {
    return this.collectionStoreService.collections();
  }

  get collectionsTotal() {
    return this.collectionStoreService.totalCount();
  }

  get collectionsLoading() {
    return this.collectionStoreService.loading();
  }

  collectionSearchQuery = '';
  collectionPageSize = 6;
  collectionPageIndex = 0;
  private collectionSearchDebouncer = new Debouncer();

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const username = params.get('username');
        if (!username) return;
        this.pageIndex = 0;
        this.loadProfile(username);
      });
  }

  async loadProfile(username: string) {
    this.username = username;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.profileUser.set(null);

    try {
      const res = await firstValueFrom(this.userApiService.getByUserName(username));
      this.profileUser.set(res.user);
      await Promise.all([this.loadPens(), this.loadCollections()]);
    } catch (err: any) {
      if (err?.status === 403) {
        this.errorMessage.set(err?.error?.message || 'This profile is private.');
      } else if (err?.status === 404) {
        this.errorMessage.set('User not found.');
      } else {
        this.errorMessage.set('Failed to load profile.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async loadPens(page = 1, limit = this.pageSize) {
    try {
      await this.snippetStoreService.loadUserPublicSnippets(
        this.username,
        page,
        limit,
        this.penSearchQuery.trim() || undefined
      );
    } catch (error) {
      console.error('Error loading user snippets:', error);
    }
  }

  async loadCollections(page = 1, limit = this.collectionPageSize) {
    try {
      await this.collectionStoreService.loadUser(
        this.username,
        page,
        limit,
        this.collectionSearchQuery.trim() || undefined
      );
    } catch (error) {
      console.error('Error loading user collections:', error);
    }
  }

  ngOnDestroy() {
    this.penSearchDebouncer.clear();
    this.collectionSearchDebouncer.clear();
  }

  handlePenSearch(searchQuery: string) {
    this.penSearchQuery = searchQuery;
    this.pageIndex = 0;
    this.penSearchDebouncer.run(() => this.loadPens(this.pageIndex + 1, this.pageSize));
  }

  handlePenPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPens(event.pageIndex + 1, event.pageSize);
  }

  handleCollectionSearch(searchQuery: string) {
    this.collectionSearchQuery = searchQuery;
    this.collectionPageIndex = 0;
    this.collectionSearchDebouncer.run(() =>
      this.loadCollections(this.collectionPageIndex + 1, this.collectionPageSize)
    );
  }

  handleCollectionPageChange(event: PageEvent) {
    this.collectionPageIndex = event.pageIndex;
    this.collectionPageSize = event.pageSize;
    void this.loadCollections(event.pageIndex + 1, event.pageSize);
  }

  async toggleFollow() {
    const user = this.profileUser();
    if (!user || this.followLoading()) return;

    this.followLoading.set(true);
    const wasFollowing = !!user.isFollowing;
    try {
      const res = wasFollowing
        ? await firstValueFrom(this.followApiService.unfollow(user.userName))
        : await firstValueFrom(this.followApiService.follow(user.userName));
      const nowFollowing = res.isFollowing ?? !wasFollowing;

      this.profileUser.update(u => u ? {
        ...u,
        isFollowing: nowFollowing,
        followerCount: Math.max(0, (u.followerCount ?? 0) + (nowFollowing ? 1 : -1)),
      } : u);

      this.snackbarService.success(nowFollowing ? `Following @${user.userName}` : `Unfollowed @${user.userName}`);
    } catch {
      this.snackbarService.error('Failed to update follow status');
    } finally {
      this.followLoading.set(false);
    }
  }

  openCollection(collection: Collection) {
    this.router.navigate(['/collections', collection.shortId]);
  }
}
