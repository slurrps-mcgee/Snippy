import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStoreService } from '@app/services/stores/auth.store.service';

/**
 * Single place that knows Snippy's URL shapes, so components never hand-build
 * route arrays for profiles, snippets, or collections.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);
  private authStore = inject(AuthStoreService);

  toHome() {
    return this.router.navigate(['/home']);
  }

  toSettings() {
    return this.router.navigate(['/settings']);
  }

  toNewSnippet() {
    return this.router.navigate(['/snippet']);
  }

  toProfile(userName: string | null | undefined) {
    if (!userName) return Promise.resolve(false);
    return this.router.navigate(['/', userName]);
  }

  toCurrentUserProfile() {
    return this.toProfile(this.authStore.user()?.userName);
  }

  /** Owner falls back to the signed-in user so freshly created snippets still route. */
  toSnippet(shortId: string, userName?: string | null) {
    const owner = userName || this.authStore.user()?.userName || 'me';
    return this.router.navigate(['/', owner, 'snippet', shortId]);
  }

  toParentSnippet(parentShortId: string | null | undefined, parentUserName: string | null | undefined) {
    if (!parentShortId || !parentUserName) return Promise.resolve(false);
    return this.router.navigate(['/', parentUserName, 'snippet', parentShortId]);
  }

  toCollection(shortId: string) {
    return this.router.navigate(['/collections', shortId]);
  }

  fullPageUrl(shortId: string, userName?: string | null) {
    const owner = userName || this.authStore.user()?.userName || 'me';
    return `/${owner}/fullpage/${shortId}`;
  }
}
