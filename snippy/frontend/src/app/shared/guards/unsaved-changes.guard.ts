import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SnippetStoreService } from '../services/store.services/snippet.store.service';
import { ConfirmDialogComponent } from '../components/dialogs/confirm-dialog/confirm-dialog.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const unsavedChangesGuard: CanDeactivateFn<any> = () => {
  const snippetStoreService = inject(SnippetStoreService);
  const dialog = inject(MatDialog);

  if (!snippetStoreService.isDirty()) {
    return true;
  }

  const dialogRef = dialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: {
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      confirmText: 'Leave',
      cancelText: 'Stay'
    }
  });

  return dialogRef.afterClosed().pipe(
    map(result => result === true)
  );
};
