import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CollectionStoreService } from '../../../services/store.services/collection.store.service';
import { SnackbarService } from '../../../services/component.services/snackbar.service';
import { Collection } from '../../../interfaces/collection.interface';

const DESCRIPTION_MAX_LENGTH = 2500;

@Component({
  selector: 'app-collection-create-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './collection-create-dialog.component.html',
  styleUrl: './collection-create-dialog.component.scss',
})
export class CollectionCreateDialogComponent {
  dialogRef = inject(MatDialogRef<CollectionCreateDialogComponent, Collection | false>);
  private collectionStore = inject(CollectionStoreService);
  private snackbarService = inject(SnackbarService);

  readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;

  name = '';
  description = '';
  isPrivate = false;
  creating = signal(false);

  get isValid(): boolean {
    return this.name.trim().length > 0 && this.description.length <= this.descriptionMaxLength;
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  async onCreate() {
    if (!this.isValid || this.creating()) return;

    this.creating.set(true);
    try {
      const collection = await this.collectionStore.create({
        name: this.name.trim(),
        description: this.description.trim() || null,
        isPrivate: this.isPrivate,
      });
      this.snackbarService.success(`Collection "${this.name.trim()}" created`);
      this.dialogRef.close(collection ?? false);
    } catch {
      this.snackbarService.error('Failed to create collection');
    } finally {
      this.creating.set(false);
    }
  }
}
