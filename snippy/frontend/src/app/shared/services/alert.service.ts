import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent, AlertDialogData } from '../components/dialogs/alert-dialog/alert-dialog.component';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private dialog = inject(MatDialog);

  info(title: string, message: string) {
    this.dialog.open(AlertDialogComponent, {
      data: { title, message, type: 'info' }
    });
  }

  success(title: string, message: string) {
    this.dialog.open(AlertDialogComponent, {
      data: { title, message, type: 'success' }
    });
  }

  error(title: string, message: string) {
    this.dialog.open(AlertDialogComponent, {
      data: { title, message, type: 'error' }
    });
  }

  warning(title: string, message: string) {
    this.dialog.open(AlertDialogComponent, {
      data: { title, message, type: 'warning' }
    });
  }
}
