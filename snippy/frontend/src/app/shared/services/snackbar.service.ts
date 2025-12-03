import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, duration: number = 3000) {
    this.show(message, 'success-snackbar', duration);
  }

  error(message: string, duration: number = 5000) {
    this.show(message, 'error-snackbar', duration);
  }

  info(message: string, duration: number = 3000) {
    this.show(message, 'info-snackbar', duration);
  }

  warning(message: string, duration: number = 4000) {
    this.show(message, 'warning-snackbar', duration);
  }

  private show(message: string, panelClass: string, duration: number) {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [panelClass]
    };

    this.snackBar.open(message, 'Close', config);
  }
}
