import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CollectionStoreService } from '../../../services/store.services/collection.store.service';
import { SnackbarService } from '../../../services/component.services/snackbar.service';
import { Collection } from '../../../interfaces/collection.interface';
import { CollectionCreateDialogComponent } from '../collection-create-dialog/collection-create-dialog.component';

export interface AddToCollectionDialogData {
  snippetId: string;
}

@Component({
  selector: 'app-add-to-collection-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-to-collection-dialog.component.html',
  styleUrl: './add-to-collection-dialog.component.scss',
})
export class AddToCollectionDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AddToCollectionDialogComponent>);
  data = inject<AddToCollectionDialogData>(MAT_DIALOG_DATA);

  private collectionStore = inject(CollectionStoreService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  addingId = signal<string | null>(null);

  get collections(): Collection[] {
    return this.collectionStore.collections();
  }

  get loading(): boolean {
    return this.collectionStore.loading();
  }

  ngOnInit(): void {
    void this.collectionStore.loadMine(1, 50, this.data.snippetId);
  }

  isInCollection(collection: Collection): boolean {
    return !!collection.containsSnippet;
  }

  async addTo(collection: Collection) {
    if (this.isInCollection(collection) || this.addingId()) return;

    this.addingId.set(collection.collectionId);
    try {
      await this.collectionStore.addSnippet(collection.collectionId, this.data.snippetId);
      this.snackbarService.success(`Added to "${collection.name}"`);
      this.dialogRef.close(true);
    } catch {
      this.snackbarService.error(`Failed to add to "${collection.name}"`);
    } finally {
      this.addingId.set(null);
    }
  }

  createNewCollection() {
    const createRef = this.dialog.open(CollectionCreateDialogComponent, { width: '480px' });
    createRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((collection: Collection | false) => {
        if (collection) {
          void this.addTo(collection);
        }
      });
  }

  close() {
    this.dialogRef.close();
  }
}
