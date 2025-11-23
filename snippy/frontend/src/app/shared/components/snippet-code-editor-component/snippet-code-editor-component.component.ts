import { Component, signal, Input, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { AngularSplitModule } from 'angular-split';
import { CommonModule } from '@angular/common';
import { min } from 'rxjs';

@Component({
  selector: 'app-snippet-code-editor-component',
  imports: [FormsModule, MonacoEditorModule, CommonModule, AngularSplitModule],
  templateUrl: './snippet-code-editor-component.component.html',
  styleUrl: './snippet-code-editor-component.component.scss'
})
export class SnippetCodeEditorComponentComponent {
  // Inputs for initial values
  @Input() initialHtml = '<h1>Hello World!</h1>';
  @Input() initialCss = 'h1 { color: red; }';
  @Input() initialJs = 'console.log("Hello");';

  // Initialize signals with inputs
  ngOnInit() {
    this.htmlCode.set(this.initialHtml);
    this.cssCode.set(this.initialCss);
    this.jsCode.set(this.initialJs);
  }

  // Signals for editing
  htmlCode = signal('');
  cssCode = signal('');
  jsCode = signal('');

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

  // // Combined output for live preview
  // combinedOutput = computed(() => `
  //   <html>
  //     <head>
  //       <style>${this.cssCode()}</style></head>
  //     <body>
  //       ${this.htmlCode()}
  //       <script>${this.jsCode()}<\/script>
  //     </body>
  //   </html>
  // `);

  @ViewChild('previewIframe') previewIframe!: ElementRef<HTMLIFrameElement>;

  // Update iframe content manually
  updateIframe() {
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
