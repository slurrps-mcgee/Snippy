import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Collection } from '../../../shared/interfaces/collection.interface';

@Component({
  selector: 'app-collection-list',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './collection-list.component.html',
  styleUrl: './collection-list.component.scss',
})
export class CollectionListComponent {
  @Input() collections: Collection[] = [];
  @Input() total = 0;
  @Input() pageSize = 6;
  @Input() pageIndex = 0;
  @Input() showNewButton = false;
  @Input() showDelete = false;
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() createNew = new EventEmitter<void>();
  @Output() openCollection = new EventEmitter<Collection>();
  @Output() deleteCollection = new EventEmitter<Collection>();

  searchQuery = '';

  onSearchChange() {
    this.searchChange.emit(this.searchQuery);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  onCreate() {
    this.createNew.emit();
  }

  onOpen(collection: Collection) {
    this.openCollection.emit(collection);
  }

  onDelete(collection: Collection, event: Event) {
    event.stopPropagation();
    this.deleteCollection.emit(collection);
  }
}
