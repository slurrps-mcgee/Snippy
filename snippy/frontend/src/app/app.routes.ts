import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { HomePageComponent } from './core/pages/home-page/home-page.component';
import { unsavedChangesGuard } from './shared/guards/unsaved-changes.guard';

export type HeaderMode = 'landing' | 'feed' | 'editor' | 'minimal';

export const routes: Routes = [
  { path: '', component: HomePageComponent, data: { header: 'landing' satisfies HeaderMode } },

  {
    path: 'home',
    loadComponent: () =>
      import('./core/pages/user-home-page/user-home-page.component').then(m => m.UserHomePageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'following',
    loadComponent: () =>
      import('./core/pages/following-page/following-page.component').then(m => m.FollowingPageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'public',
    loadComponent: () =>
      import('./core/pages/public-page/public-page.component').then(m => m.PublicPageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./core/pages/settings-page/settings-page.component').then(m => m.SettingsPageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'collections/:shortId',
    loadComponent: () =>
      import('./core/pages/collection-detail-page/collection-detail-page.component').then(
        m => m.CollectionDetailPageComponent
      ),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },
  {
    path: 'snippet',
    loadComponent: () =>
      import('./shared/components/views/snippet-web-view/snippet-web-view.component').then(
        m => m.SnippetWebViewComponent
      ),
    canActivate: [AuthGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { header: 'editor' satisfies HeaderMode },
  },
  {
    path: ':username/snippet/:id',
    loadComponent: () =>
      import('./shared/components/views/snippet-web-view/snippet-web-view.component').then(
        m => m.SnippetWebViewComponent
      ),
    canActivate: [AuthGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { header: 'editor' satisfies HeaderMode },
  },
  {
    path: ':username/fullpage/:id',
    loadComponent: () =>
      import('./shared/components/views/fullpage-view/fullpage-view.component').then(
        m => m.FullpageViewComponent
      ),
    canActivate: [AuthGuard],
    data: { header: 'minimal' satisfies HeaderMode },
  },
  {
    path: ':username',
    loadComponent: () =>
      import('./core/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
    canActivate: [AuthGuard],
    data: { header: 'feed' satisfies HeaderMode },
  },

  { path: '**', redirectTo: '' },
];
