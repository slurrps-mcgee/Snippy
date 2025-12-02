import { Component, signal, Input, ViewChild, ElementRef, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { AngularSplitModule } from 'angular-split';
import { CommonModule } from '@angular/common';
import { Snippet } from '../../interfaces/snippet.interface';
import { SnippetService } from '../../services/snippet.service';

@Component({
  selector: 'app-snippet-code-editor-component',
  imports: [FormsModule, MonacoEditorModule, CommonModule, AngularSplitModule],
  templateUrl: './snippet-code-editor-component.component.html',
  styleUrl: './snippet-code-editor-component.component.scss'
})
export class SnippetCodeEditorComponentComponent {
  @Input() snippet!: Snippet;

  // Signals for editing
  htmlCode = signal('');
  cssCode = signal('');
  jsCode = signal('');

  constructor(private snippetService: SnippetService) {
    // Reactive iframe update whenever any code changes
    effect(() => {
      // Read all signals to trigger effect
      this.htmlCode();
      this.cssCode();
      this.jsCode();
      // Update iframe
      this.updateIframe();
    });
  }

  // Initialize signals with snippet data
  ngOnInit() {
    if (this.snippet) {
      const htmlFile = this.snippet.snippetFiles.find(f => f.fileType === 'html');
      const cssFile = this.snippet.snippetFiles.find(f => f.fileType === 'css');
      const jsFile = this.snippet.snippetFiles.find(f => f.fileType === 'js' || f.fileType === 'js');
      
      this.htmlCode.set(htmlFile?.content || '');
      this.cssCode.set(cssFile?.content || '');
      this.jsCode.set(jsFile?.content || '');
    }
  }

  onHtmlChange(content: string) {
    this.htmlCode.set(content);
    this.snippetService.updateSnippetFile('html', content);
  }

  onCssChange(content: string) {
    this.cssCode.set(content);
    this.snippetService.updateSnippetFile('css', content);
  }

  onJsChange(content: string) {
    this.jsCode.set(content);
    this.snippetService.updateSnippetFile('js', content);
  }

  // Monaco editor options
  htmlOptions = { 
    theme: 'vs-dark', 
    language: 'html', 
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on'
  };
  cssOptions = { 
    theme: 'vs-dark', 
    language: 'css', 
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on'
  };
  jsOptions = { 
    theme: 'vs-dark', 
    language: 'javascript', 
    automaticLayout: true ,
    minimap: { enabled: false },
    wordWrap: 'on'
  };

  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  // Update iframe content (called by effect)
  updateIframe() {
    if (!this.previewIframe) return;
    const iframe = this.previewIframe.nativeElement;
    if (!iframe.contentDocument) return;

    iframe.contentDocument.open();
    iframe.contentDocument.write(`
      <html>
        <head><style>${this.cssCode()}</style></head>
        <body>
          ${this.htmlCode()}
          <script>${this.jsCode()}<\/script>
        </body>
      </html>
    `);
    iframe.contentDocument.close();
  }
}
