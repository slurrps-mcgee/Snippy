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
    MatButtonModule
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

  constructor(private router: Router) {}

  onSearchChange() {
    this.searchChange.emit(this.searchQuery);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  viewSnippet(snippet: SnippetList) {
    console.log('Navigating to snippet:', snippet.userName, snippet.shortId);
    this.router.navigate([snippet.userName, 'snippet', snippet.shortId]);
  }

  createNewSnippet() {
    this.router.navigate(['snippet']);
  }
}