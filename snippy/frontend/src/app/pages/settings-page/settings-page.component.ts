import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, firstValueFrom } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthStoreService } from '@app/services/stores/auth.store.service';
import { UserApiService } from '@app/services/api/user.api.service';
import { SnackbarService } from '@app/services/ui/snackbar.service';
import { DialogService } from '@app/services/ui/dialog.service';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'current';

@Component({
  selector: 'app-settings-page',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent implements OnInit {
  private authStore = inject(AuthStoreService);
  private userApi = inject(UserApiService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  get user() {
    return this.authStore.user;
  }

  // Profile tab
  displayName = '';
  bio = '';
  profileSaving = signal(false);

  // Account tab
  userName = '';
  usernameStatus = signal<UsernameStatus>('idle');
  usernameSaving = signal(false);
  deleting = signal(false);

  private usernameCheck$ = new Subject<string>();
  private hydratedUserName: string | null = null;

  constructor() {
    effect(() => {
      const u = this.user();
      if (!u) {
        this.hydratedUserName = null;
        return;
      }
      if (this.hydratedUserName === u.userName) return;
      if (this.isProfileDirty() || this.isUsernameDirty()) return;
      this.hydrateFromUser();
    });
  }

  isProfileDirty(): boolean {
    const u = this.user();
    if (!u) return false;
    return this.displayName !== (u.displayName ?? '') || this.bio !== (u.bio ?? '');
  }

  isUsernameDirty(): boolean {
    const u = this.user();
    return !!u && this.userName.trim() !== u.userName;
  }

  canSaveUsername(): boolean {
    const status = this.usernameStatus();
    return this.isUsernameDirty() && (status === 'available' || status === 'current') && !this.usernameSaving();
  }

  usernameStatusLabel(): string {
    switch (this.usernameStatus()) {
      case 'checking':
        return 'Checking availability';
      case 'available':
        return 'Username is available';
      case 'taken':
        return 'Username is taken';
      case 'invalid':
        return 'Enter at least 2 characters';
      case 'current':
        return 'This is your current username';
      default:
        return '';
    }
  }

  ngOnInit(): void {
    this.hydrateFromUser();

    this.usernameCheck$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(name => {
          const trimmed = name.trim();
          const current = this.user()?.userName ?? '';
          if (!trimmed || trimmed.length < 2) {
            this.usernameStatus.set('invalid');
            return of(null);
          }
          if (trimmed === current) {
            this.usernameStatus.set('current');
            return of(null);
          }
          this.usernameStatus.set('checking');
          return this.userApi.checkUsername(trimmed).pipe(
            catchError(() => {
              this.usernameStatus.set('invalid');
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => {
        if (!res) return;
        this.usernameStatus.set(res.available ? 'available' : 'taken');
      });
  }

  private hydrateFromUser() {
    const u = this.user();
    if (!u) return;
    this.displayName = u.displayName ?? '';
    this.bio = u.bio ?? '';
    this.userName = u.userName ?? '';
    this.usernameStatus.set('current');
    this.hydratedUserName = u.userName;
  }

  onUsernameInput(value: string) {
    this.userName = value;
    this.usernameCheck$.next(value);
  }

  async saveProfile() {
    if (!this.isProfileDirty() || this.profileSaving()) return;
    this.profileSaving.set(true);
    try {
      const res = await firstValueFrom(
        this.userApi.updateProfile({
          displayName: this.displayName.trim(),
          bio: this.bio.trim() || null,
        })
      );
      if (res?.user) {
        this.authStore.setUserFromApi(res.user);
        this.hydrateFromUser();
      }
      this.snackbar.success('Profile updated');
    } catch {
      this.snackbar.error('Failed to update profile');
    } finally {
      this.profileSaving.set(false);
    }
  }

  async saveUsername() {
    if (!this.canSaveUsername()) return;
    this.usernameSaving.set(true);
    try {
      const res = await firstValueFrom(
        this.userApi.updateProfile({ userName: this.userName.trim() })
      );
      if (res?.user) {
        this.authStore.setUserFromApi(res.user);
        this.hydrateFromUser();
      }
      this.snackbar.success('Username updated');
    } catch {
      this.snackbar.error('Failed to update username');
    } finally {
      this.usernameSaving.set(false);
    }
  }

  async confirmDeleteAccount() {
    const deleted = await this.dialogService.confirmAndRun({
      confirm: {
        title: 'Delete account',
        message:
          'This permanently deletes your account, snippets, collections, and assets. This cannot be undone.',
        confirmText: 'Delete account',
        cancelText: 'Cancel',
      },
      action: async () => {
        this.deleting.set(true);
        await firstValueFrom(this.userApi.deleteAccount());
      },
      success: 'Account deleted',
      error: 'Failed to delete account',
    });

    if (deleted) {
      this.authStore.logout();
    } else {
      this.deleting.set(false);
    }
  }
}
