import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

/** Centered paginator with the page sizes used across Snippy's list grids. */
@Component({
  selector: 'app-list-paginator',
  imports: [MatPaginatorModule],
  template: `
    @if (!hideWhenSinglePage || total > pageSize || pageIndex > 0) {
    <div class="flex justify-center p-3">
      <mat-paginator [length]="total" [pageSize]="pageSize" [pageSizeOptions]="pageSizeOptions"
        [pageIndex]="pageIndex" (page)="pageChange.emit($event)" showFirstLastButtons>
      </mat-paginator>
    </div>
    }
  `,
})
export class ListPaginatorComponent {
  @Input() total = 0;
  @Input() pageSize = 6;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [6, 12, 24];
  @Input() hideWhenSinglePage = false;
  @Output() pageChange = new EventEmitter<PageEvent>();
}
