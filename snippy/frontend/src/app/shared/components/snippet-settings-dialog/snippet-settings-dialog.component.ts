import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Snippet } from '../../interfaces/snippet.interface';

@Component({
  selector: 'app-snippet-settings-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './snippet-settings-dialog.component.html',
  styleUrl: './snippet-settings-dialog.component.scss'
})
export class SnippetSettingsDialogComponent {
  description: string;
  isPrivate: boolean;
  tags: string[];
  newTag: string = '';

  constructor(
    public dialogRef: MatDialogRef<SnippetSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Snippet
  ) {
    this.description = data.description || '';
    this.isPrivate = data.isPrivate;
    this.tags = [...(data.tags || [])];
  }

  addTag() {
    const tag = this.newTag.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close({
      description: this.description,
      isPrivate: this.isPrivate,
      tags: this.tags
    });
  }
}
