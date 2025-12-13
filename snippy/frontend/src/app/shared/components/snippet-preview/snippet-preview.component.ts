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
  updatePreview(html: string, css: string, js: string, previewUpdateType: string | null) {
    if (!this.previewIframe) return;

    // If only CSS changed, update styles inline without reloading
    if (previewUpdateType?.toLocaleLowerCase() === 'partial') {
      this.updateCssOnly(css);
    } else {
      this.fullReload(html, css, js);
    }
  }

  // Full iframe reload for JS/HTML changes
  private fullReload(html: string, css: string, js: string) {
    if (!this.previewIframe) return;

    const iframe = this.previewIframe.nativeElement;

    iframe.srcdoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style id="snippet-style">${css}</style>
      </head>
      <body>
        ${html}
        <script>
          ${js}
        <\/script>
      </body>
    </html>
  `;
  }

  // Update only CSS without reloading the iframe
  private updateCssOnly(css: string) {
    if (!this.previewIframe) return;

    const iframe = this.previewIframe.nativeElement;
    const doc = iframe.contentDocument;

    if (!doc) return;

    let styleEl = doc.getElementById('snippet-style') as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = 'snippet-style';
      doc.head.appendChild(styleEl);
    }

    styleEl.textContent = css;
  }
}
