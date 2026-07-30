import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FollowApiService } from '@app/services/api/follow.api.service';
import { SnackbarService } from '@app/services/ui/snackbar.service';

/**
 * Follow/unfollow with the shared snackbar feedback. Returns the resulting
 * state so callers can patch their own view models.
 */
@Injectable({ providedIn: 'root' })
export class FollowUiService {
  private followApi = inject(FollowApiService);
  private snackbar = inject(SnackbarService);

  async toggle(userName: string, isFollowing: boolean): Promise<boolean | null> {
    try {
      const res = isFollowing
        ? await firstValueFrom(this.followApi.unfollow(userName))
        : await firstValueFrom(this.followApi.follow(userName));
      const nowFollowing = res.isFollowing ?? !isFollowing;
      this.snackbar.success(
        nowFollowing ? `Following @${userName}` : `Unfollowed @${userName}`
      );
      return nowFollowing;
    } catch {
      this.snackbar.error('Failed to update follow status');
      return null;
    }
  }
}
