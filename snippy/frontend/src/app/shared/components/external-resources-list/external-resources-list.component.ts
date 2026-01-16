import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExternalResource } from '../../interfaces/externalResource.interface';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-external-resources-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatListModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatButtonModule, 
    DragDropModule],
  templateUrl: './external-resources-list.component.html',
  styleUrl: './external-resources-list.component.scss'
})
export class ExternalResourcesListComponent {
  @Input() resources: ExternalResource[] = [];
  @Input() resourceType: 'css' | 'js' = 'css';
  @Output() resourcesChange = new EventEmitter<ExternalResource[]>();

  ngOnInit() {
    if (!this.resources || this.resources.length === 0) {
      this.addResource();
    }
  }

  addResource() {
    // Only add a new empty resource if there isn't already one
    if (!this.resources.some(r => !r.url || !r.url.trim())) {
      this.resources.push({ resourceType: this.resourceType, url: '' });
      this.resourcesChange.emit(this.resources);
    }
  }

  removeResource(index: number) {
    this.resources.splice(index, 1);
    this.resourcesChange.emit(this.resources);
    // Always keep at least one empty input
    if (this.resources.length === 0) {
      this.addResource();
    }
  }

  drop(event: CdkDragDrop<ExternalResource[]>) {
    moveItemInArray(this.resources, event.previousIndex, event.currentIndex);
    this.resourcesChange.emit(this.resources);
  }
}
