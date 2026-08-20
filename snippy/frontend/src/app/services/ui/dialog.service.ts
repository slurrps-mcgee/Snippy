import { Injectable, inject, Type } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DEFAULT_OPTIONS,
} from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  AlertDialogComponent,
  AlertDialogData,
} from '@app/components/dialogs/alert-dialog/alert-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '@app/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '@app/services/ui/snackbar.service';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ConfirmAndRunOptions {
  confirm: ConfirmDialogData;
  action: () => Promise<unknown>;
  success?: string;
  error?: string;
}

const DIALOG_MAX_HEIGHT = '85vh';

/**
 * Width-only presets: dialogs size to their content vertically and are capped by
 * DIALOG_MAX_HEIGHT, so no surface is left with dead space below short content.
 */
const SIZE_PRESETS: Record<DialogSize, MatDialogConfig> = {
  sm: { width: 'min(26rem, 92vw)' },
  md: { width: 'min(32rem, 92vw)' },
  lg: { width: 'min(44rem, 94vw)' },
  xl: { width: 'min(60rem, 94vw)' },
};

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);

  open<T, D = unknown, R = any>(
    component: Type<T>,
    size: DialogSize = 'md',
    config: MatDialogConfig<D> = {}
  ): MatDialogRef<T, R> {
    return this.dialog.open(component, {
      ...SIZE_PRESETS[size],
      ...config,
      maxHeight: DIALOG_MAX_HEIGHT,
      panelClass: ['snippy-dialog', ...asArray(config.panelClass)],
    });
  }

  confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      'sm',
      { data }
    );
    return firstValueFrom(ref.afterClosed()).then((result) => !!result);
  }

  /**
   * Confirm, run the action, and report the outcome through the snackbar.
   * Resolves to whether the action ran and succeeded.
   */
  async confirmAndRun(options: ConfirmAndRunOptions): Promise<boolean> {
    const confirmed = await this.confirm(options.confirm);
    if (!confirmed) return false;
    try {
      await options.action();
      if (options.success) this.snackbar.success(options.success);
      return true;
    } catch {
      if (options.error) this.snackbar.error(options.error);
      return false;
    }
  }

  alert(data: AlertDialogData): MatDialogRef<AlertDialogComponent> {
    return this.open(AlertDialogComponent, 'sm', { data });
  }

  info(title: string, message: string) {
    return this.alert({ title, message, type: 'info' });
  }

  success(title: string, message: string) {
    return this.alert({ title, message, type: 'success' });
  }

  error(title: string, message: string) {
    return this.alert({ title, message, type: 'error' });
  }

  warning(title: string, message: string) {
    return this.alert({ title, message, type: 'warning' });
  }
}

export function provideDialogDefaults() {
  return {
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: {
      maxHeight: DIALOG_MAX_HEIGHT,
      autoFocus: 'first-tabbable',
      panelClass: 'snippy-dialog',
    } satisfies MatDialogConfig,
  };
}

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
