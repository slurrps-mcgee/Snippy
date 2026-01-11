import { Component, Input, Output, EventEmitter, DestroyRef, inject } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import {TooltipPosition, MatTooltipModule} from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { SnippetService } from '../../services/snippet.service';
import { SnackbarService } from '../../services/snackbar.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { FavoriteService } from '../../services/favorite.service';

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
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule
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
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private snippetService: SnippetService,
    private favoriteService: FavoriteService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) { }

  onSearchChange() {
    this.searchChange.emit(this.searchQuery);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  openSnippet(snippet: SnippetList) {
    this.router.navigate([snippet.userName, 'snippet', snippet.shortId]);
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

    // Call favorite service to toggle favorite
    this.favoriteService.favoriteSnippet(snippet.snippetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          // Assume backend returns { favoriteCount: number, isFavorited: boolean }
          if (response && typeof response.favoriteCount === 'number') {
            snippet.favoriteCount = response.favoriteCount;
            this.snackbarService.success(
              response.isFavorited
                ? `Added to favorites ${snippet.shortId}`
                : `Removed from favorites ${snippet.shortId}`
            );
          } else {
            // Fallback: just increment or decrement locally
            snippet.favoriteCount = (snippet.favoriteCount || 0) + 1;
            this.snackbarService.success(`Toggled favorite for ${snippet.shortId}`);
          }
        },
        error: () => {
          this.snackbarService.error(`Failed to toggle favorite for ${snippet.shortId}`);
        }
      });
  }

  commentOnSnippet(snippet: SnippetList, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.snackbarService.success(`Added comment to ${snippet.shortId}`);

  }

  deleteSnippet(snippet: SnippetList, event?: Event) {
    if (event) {
      event.stopPropagation();
    }


    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Snippet',
        message: `Are you sure you want to delete Snippet ${snippet.shortId}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snippetService.deleteSnippet(snippet.snippetId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbarService.success(`Deleted Snippet ${snippet.shortId}`);
              // Optionally, emit an event to refresh the list
              this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize, length: this.total });
            },
            error: () => {
              this.snackbarService.error(`Failed to delete Snippet ${snippet.shortId}`);
            }
          });
      }
    });

  }
}