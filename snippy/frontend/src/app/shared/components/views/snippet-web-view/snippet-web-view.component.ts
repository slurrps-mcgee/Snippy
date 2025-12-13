import { Component, ViewChild, ElementRef, effect, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { CommonModule } from '@angular/common';
import { SnippetEditorComponent } from '../../snippet-editor/snippet-editor.component';
import { SnippetPreviewComponent } from '../../snippet-preview/snippet-preview.component';
import { Snippet } from '../../../interfaces/snippet.interface';
import { SnippetStateService } from '../../../services/snippet-state.service';

@Component({
  selector: 'app-snippet-web-view',
  imports: [CommonModule, AngularSplitModule, SnippetEditorComponent, SnippetPreviewComponent],
  templateUrl: './snippet-web-view.component.html',
  styleUrl: './snippet-web-view.component.scss',
})
export class SnippetWebViewComponent implements OnInit, AfterViewInit, OnDestroy {
  // Reference to the preview component
  @ViewChild(SnippetPreviewComponent) previewComponent?: SnippetPreviewComponent;

  constructor(public snippetStateService: SnippetStateService) {
    // Watch snippet state service for code changes and update preview
    effect(() => {
      const snippet = this.snippetStateService.snippet();
      const previewUpdateType = this.snippetStateService.previewUpdateType();
      
      // Only update preview if a code file actually changed
      if (!previewUpdateType || !snippet?.snippetFiles) return;
      
      const htmlFile = snippet.snippetFiles.find(f => f.fileType === 'html');
      const cssFile = snippet.snippetFiles.find(f => f.fileType === 'css');
      const jsFile = snippet.snippetFiles.find(f => f.fileType === 'js');
      
      this.updatePreview(
        htmlFile?.content || '',
        cssFile?.content || '',
        jsFile?.content || '',
        previewUpdateType
      );
    });
  }

  ngOnInit() {
    // Initialization handled by effect watching state service
  }

  ngAfterViewInit() {
    // Initial preview update handled by effect
  }

  ngOnDestroy() {
    // Clean up if needed
  }

  // Update preview by passing code to preview component
  private updatePreview(html: string, css: string, js: string, previewUpdateType: string| null) {
    if (!this.previewComponent) {
      // If preview component not ready, retry after a short delay
      setTimeout(() => {
        if (this.previewComponent) {
          this.previewComponent.updatePreview(html, css, js, previewUpdateType);
        }
      }, 100);
      return;
    }
    
    this.previewComponent.updatePreview(html, css, js, previewUpdateType);
  }
}
