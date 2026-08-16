import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { unsavedChangesGuard } from '@app/guards/unsaved-changes.guard';
import type { SnippetFeed } from '@app/pages/snippet-feed-page/snippet-feed-page.component';
import type { HeaderMode } from '@app/interfaces/header-mode';

export const routes: Routes = [
  { path: '', component: HomePageComponent, data: { header: 'landing' satisfies HeaderMode } },

  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/privacy-policy-page/privacy-policy-page.component').then(
        m => m.PrivacyPolicyPageComponent
      ),
    data: { header: 'landing' satisfies HeaderMode },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pages/terms-page/terms-page.component').then(m => m.TermsPageComponent),
    data: { header: 'landing' satisfies HeaderMode },
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./pages/user-home-page/user-home-page.component').then(m => m.UserHomePageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'following',
    loadComponent: () =>
      import('./pages/snippet-feed-page/snippet-feed-page.component').then(
        m => m.SnippetFeedPageComponent
      ),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode, feed: 'following' satisfies SnippetFeed },
  },
  {
    path: 'public',
    loadComponent: () =>
      import('./pages/snippet-feed-page/snippet-feed-page.component').then(
        m => m.SnippetFeedPageComponent
      ),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode, feed: 'public' satisfies SnippetFeed },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(m => m.SettingsPageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'collections/:shortId',
    loadComponent: () =>
      import('./pages/collection-detail-page/collection-detail-page.component').then(
        m => m.CollectionDetailPageComponent
      ),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'embed/:shortId',
    loadComponent: () =>
      import('./pages/embed-player-page/embed-player-page.component').then(
        m => m.EmbedPlayerPageComponent
      ),
    data: { header: 'embed' satisfies HeaderMode },
  },
  {
    path: 's/:token',
    loadComponent: () =>
      import('./pages/snippet-web-view/snippet-web-view.component').then(
        m => m.SnippetWebViewComponent
      ),
    canDeactivate: [unsavedChangesGuard],
    data: { header: 'editor' satisfies HeaderMode, share: true },
  },
  {
    path: 'try',
    loadComponent: () =>
      import('./pages/snippet-web-view/snippet-web-view.component').then(
        m => m.SnippetWebViewComponent
      ),
    canDeactivate: [unsavedChangesGuard],
    data: { header: 'editor' satisfies HeaderMode, guest: true },
  },
  {
    path: 'snippet',
    loadComponent: () =>
      import('./pages/snippet-web-view/snippet-web-view.component').then(
        m => m.SnippetWebViewComponent
      ),
    canActivate: [AuthGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { header: 'editor' satisfies HeaderMode },
  },
  {
    path: ':username/snippet/:id',
    loadComponent: () =>
      import('./pages/snippet-web-view/snippet-web-view.component').then(
        m => m.SnippetWebViewComponent
      ),
    canActivate: [AuthGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { header: 'editor' satisfies HeaderMode },
  },
  {
    path: ':username/fullpage/:id',
    loadComponent: () =>
      import('./pages/fullpage-view/fullpage-view.component').then(
        m => m.FullpageViewComponent
      ),
    canActivate: [AuthGuard],
    data: { header: 'minimal' satisfies HeaderMode },
  },
  {
    path: ':username',
    loadComponent: () =>
      import('./pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },

  { path: '**', redirectTo: '' },
];
