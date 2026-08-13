import { Component, ViewChild, ElementRef, OnDestroy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExternalResource } from '@app/interfaces/externalResource.interface';
import {
  ConsoleLevel,
  PreviewConsoleService,
} from '@app/services/ui/preview-console.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-snippet-preview',
  imports: [CommonModule],
  templateUrl: './snippet-preview.component.html',
  styleUrl: './snippet-preview.component.scss',
})
export class SnippetPreviewComponent implements OnDestroy {
  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  private previewConsole = inject(PreviewConsoleService);
  private destroyRef = inject(DestroyRef);
  private messageListenerAttached = false;

  constructor() {
    fromEvent<MessageEvent>(window, 'message')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.onConsoleMessage(event));
    this.messageListenerAttached = true;
  }

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

  private fullReload(
    html: string,
    css: string,
    js: string,
    externalResources: ExternalResource[] = []
  ) {
    if (!this.previewIframe) return;

    this.previewConsole.clear();

    const iframe = this.previewIframe.nativeElement;

    const stylesheets = externalResources
      .filter(res => res.resourceType === 'css')
      .map(res => `<link rel="stylesheet" href="${res.url}">`)
      .join('\n');

    const scripts = externalResources
      .filter(res => res.resourceType === 'js')
      .map(res => `<script src="${res.url}"><\/script>`)
      .join('\n');

    const consoleBridge = `
      <script>
        (function () {
          function serialize(value) {
            if (typeof value === 'string') return value;
            if (value instanceof Error) return value.stack || value.message;
            try { return JSON.stringify(value); }
            catch (e) { return String(value); }
          }
          function send(level, args) {
            try {
              parent.postMessage({
                source: 'snippy-console',
                level: level,
                args: Array.prototype.map.call(args, serialize)
              }, '*');
            } catch (e) {}
          }
          ['log', 'info', 'warn', 'error'].forEach(function (level) {
            var original = console[level];
            console[level] = function () {
              send(level, arguments);
              if (typeof original === 'function') {
                return original.apply(console, arguments);
              }
            };
          });
          window.addEventListener('error', function (event) {
            send('error', [event.message + (event.filename ? ' (' + event.filename + ':' + event.lineno + ')' : '')]);
          });
          window.addEventListener('unhandledrejection', function (event) {
            send('error', ['Unhandled rejection: ' + serialize(event.reason)]);
          });
        })();
      <\/script>
    `;

    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${stylesheets}
          <style id="snippet-style">${css}</style>
          ${consoleBridge}
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

  private onConsoleMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || data.source !== 'snippy-console') return;
    const level = (data.level as ConsoleLevel) || 'log';
    const args = Array.isArray(data.args) ? data.args : [String(data.args ?? '')];
    this.previewConsole.append(level, args);
  }

  ngOnDestroy() {
    // takeUntilDestroyed handles the message listener
    void this.messageListenerAttached;
  }
}
