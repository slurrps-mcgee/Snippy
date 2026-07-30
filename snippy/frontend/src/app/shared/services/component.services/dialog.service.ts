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
} from '../../components/dialogs/alert-dialog/alert-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../components/dialogs/confirm-dialog/confirm-dialog.component';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PRESETS: Record<DialogSize, MatDialogConfig> = {
  sm: { width: '400px' },
  md: { width: '480px' },
  lg: { width: '640px', maxHeight: '85vh' },
  xl: {
    width: '50vw',
    height: '80vh',
    maxWidth: '50vw',
    maxHeight: '80vh',
  },
};

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialog = inject(MatDialog);

  open<T, D = unknown, R = any>(
    component: Type<T>,
    size: DialogSize = 'md',
    config: MatDialogConfig<D> = {}
  ): MatDialogRef<T, R> {
    return this.dialog.open(component, {
      ...SIZE_PRESETS[size],
      ...config,
      panelClass: ['snippy-dialog', ...(asArray(config.panelClass))],
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
      maxHeight: '85vh',
      autoFocus: 'first-tabbable',
      panelClass: 'snippy-dialog',
    } satisfies MatDialogConfig,
  };
}

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
