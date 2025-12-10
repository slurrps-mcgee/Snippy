import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { SnippetList } from '../../interfaces/snippetList.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { SnippetService } from '../../services/snippet.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-snippet-list-component',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './snippet-list-component.component.html',
  styleUrl: './snippet-list-component.component.scss',
})
export class SnippetListComponentComponent {
  @Input() snippets: SnippetList[] = [];
  @Input() total: number = 0;
  @Input() pageSize: number = 6;
  @Input() pageIndex: number = 0;
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  searchQuery = '';

  constructor(
    private router: Router,
    private snippetService: SnippetService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {}

  onSearchChange() {
    this.searchChange.emit(this.searchQuery);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  createNewSnippet() {
    this.router.navigate(['snippet']);
  }

  viewSnippet(snippet: SnippetList) {
    // Navigate to snippet details or open in new tab
    // this.router.navigate(['/view', snippet.shortId]);
    // Also increment view count
    //this.incrementViewCount(snippet.shortId);

    this.snackbarService.success(`Viewed Snippet ${snippet.shortId}`);
  }

  favoriteSnippet(snippet: SnippetList, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    // Add favorite functionality
    this.snackbarService.success(`Added to favorites ${snippet.shortId}`);
  }

  commentOnSnippet(snippet: SnippetList, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.snackbarService.success(`Added comment to ${snippet.shortId}`);

  }
}