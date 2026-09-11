import { Injectable, inject } from '@angular/core';
import { Api } from '@app/api/generated/api';
import { followUser, unfollowUser } from '@app/api/generated/functions';
import { SnackbarService } from '@app/services/ui/snackbar.service';

/**
 * Follow/unfollow with the shared snackbar feedback. Returns the resulting
 * state so callers can patch their own view models.
 */
@Injectable({ providedIn: 'root' })
export class FollowUiService {
  private api = inject(Api);
  private snackbar = inject(SnackbarService);

  async toggle(userName: string, isFollowing: boolean): Promise<boolean | null> {
    try {
      const res = isFollowing
        ? await this.api.invoke(unfollowUser, { userName })
        : await this.api.invoke(followUser, { userName });
      const nowFollowing = res.isFollowing ?? !isFollowing;
      this.snackbar.success(nowFollowing ? `Following @${userName}` : `Unfollowed @${userName}`);
      return nowFollowing;
    } catch {
      this.snackbar.error('Failed to update follow status');
      return null;
    }
  }
}
