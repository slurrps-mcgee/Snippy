
import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExternalResource } from '../../interfaces/externalResource.interface';

@Component({
  selector: 'app-snippet-preview',
  imports: [CommonModule],
  templateUrl: './snippet-preview.component.html',
  styleUrl: './snippet-preview.component.scss',
})
export class SnippetPreviewComponent {
  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  // Update preview with HTML, CSS, and JS code

  updatePreview(
    html: string,
    css: string,
    js: string,
    previewUpdateType: string | null,
    externalResources: ExternalResource[] = []
  ) {
    
    if (!this.previewIframe) return;

    if (previewUpdateType?.toLocaleLowerCase() === 'partial') {
      this.updateCssOnly(css);
    } else {
      this.fullReload(html, css, js, externalResources);
    }
  }

  // Full iframe reload for JS/HTML changes
  private fullReload(
    html: string,
    css: string,
    js: string,
    externalResources: ExternalResource[] = []
  ) {
    if (!this.previewIframe) return;

    const iframe = this.previewIframe.nativeElement;

    // Separate stylesheets and scripts
    const stylesheets = externalResources
      .filter(res => res.resourceType === 'css')
      .map(res => `<link rel="stylesheet" href="${res.url}">`)
      .join('\n');

    const scripts = externalResources
      .filter(res => res.resourceType === 'js')
      .map(res => `<script src="${res.url}"></script>`)
      .join('\n');

    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${stylesheets}
          <style id="snippet-style">${css}</style>
        </head>
        <body>
          ${html}
          <script>
            ${js}
          <\/script>
          ${scripts}
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
