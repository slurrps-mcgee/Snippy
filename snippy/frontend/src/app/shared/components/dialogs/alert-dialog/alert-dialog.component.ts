import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface AlertDialogData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

@Component({
  selector: 'app-alert-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.scss',
})
export class AlertDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData
  ) {
    this.data.type = this.data.type || 'info';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

