import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExternalResource } from '../../interfaces/externalResource.interface';

@Component({
  selector: 'app-external-resources-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatListModule, MatIconModule, MatFormFieldModule, MatInputModule, DragDropModule],
  templateUrl: './external-resources-list.component.html',
  styleUrl: './external-resources-list.component.scss'
})
export class ExternalResourcesListComponent {
  @Input() resources: ExternalResource[] = [];
  @Input() resourceType: 'css' | 'js' = 'css';
  @Output() resourcesChange = new EventEmitter<ExternalResource[]>();

  newUrl = '';

  addResource() {
    const url = this.newUrl.trim();
    if (url) {
      this.resources.push({ resourceType: this.resourceType, url });
      this.resourcesChange.emit(this.resources);
      this.newUrl = '';
    }
  }

  removeResource(index: number) {
    this.resources.splice(index, 1);
    this.resourcesChange.emit(this.resources);
  }

  drop(event: CdkDragDrop<ExternalResource[]>) {
    moveItemInArray(this.resources, event.previousIndex, event.currentIndex);
    this.resourcesChange.emit(this.resources);
  }
}
