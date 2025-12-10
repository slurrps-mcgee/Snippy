import { Component, signal, ViewChild, ElementRef, effect, AfterViewInit, OnInit, OnDestroy, Input } from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { CommonModule } from '@angular/common';
import { SnippetEditorComponent } from '../../snippet-editor/snippet-editor.component';
import { SnippetPreviewComponent } from '../../snippet-preview/snippet-preview.component';
import { Snippet } from '../../../interfaces/snippet.interface';

@Component({
  selector: 'app-snippet-web-view',
  imports: [CommonModule, AngularSplitModule, SnippetEditorComponent, SnippetPreviewComponent],
  templateUrl: './snippet-web-view.component.html',
  styleUrl: './snippet-web-view.component.scss',
})
export class SnippetWebViewComponent implements OnInit, AfterViewInit, OnDestroy {
  // Input snippet to load code from
  @Input() snippet!: Snippet;
  // Reference to the preview component
  @ViewChild(SnippetPreviewComponent) previewComponent?: SnippetPreviewComponent;

  // Signals for code state
  htmlCode = signal('');
  cssCode = signal('');
  jsCode = signal('');

  constructor() {
    // Reactive preview update whenever any code changes
    effect(() => {
      // Read all signals to trigger effect
      this.htmlCode();
      this.cssCode();
      this.jsCode();
      // Update preview
      this.updatePreview();
    });
  }

  ngOnInit() {
    // Initialize code signals from snippet input if not null
    if (this.snippet) {
      const htmlFile = this.snippet.snippetFiles.find(f => f.fileType === 'html');
      const cssFile = this.snippet.snippetFiles.find(f => f.fileType === 'css');
      const jsFile = this.snippet.snippetFiles.find(f => f.fileType === 'js');
      
      this.htmlCode.set(htmlFile?.content || '');
      this.cssCode.set(cssFile?.content || '');
      this.jsCode.set(jsFile?.content || '');
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // Update preview after view is initialized
      this.updatePreview();
    }, 0);
  }

  ngOnDestroy() {
    // Clean up if needed
  }

  // Update preview by passing code to preview component
  private updatePreview() {
    if (this.previewComponent) {
      this.previewComponent.updatePreview(
        this.htmlCode(),
        this.cssCode(),
        this.jsCode()
      );
    }
  }

  // Handle code changes from editor components to trigger the signals
  onHtmlCodeChange(code: string) {
    this.htmlCode.set(code);
  }

  onCssCodeChange(code: string) {
    this.cssCode.set(code);
  }

  onJsCodeChange(code: string) {
    this.jsCode.set(code);
  }
}
