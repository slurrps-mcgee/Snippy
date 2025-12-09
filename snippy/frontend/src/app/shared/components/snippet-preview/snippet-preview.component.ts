import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-snippet-preview',
  imports: [CommonModule],
  templateUrl: './snippet-preview.component.html',
  styleUrl: './snippet-preview.component.scss',
})
export class SnippetPreviewComponent {
  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  // Update preview with HTML, CSS, and JS code
  updatePreview(htmlCode: string, cssCode: string, jsCode: string) {
    if (!this.previewIframe) return;
    const iframe = this.previewIframe.nativeElement;
    if (!iframe.contentDocument) return;

    iframe.contentDocument.open();
    iframe.contentDocument.write(`
      <html>
        <head><style>${cssCode}</style></head>
        <body>
          ${htmlCode}
          <script>${jsCode}<\/script>
        </body>
      </html>
    `);
    iframe.contentDocument.close();
  }
}
