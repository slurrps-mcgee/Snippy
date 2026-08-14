import { Component, ViewChild, ElementRef, OnDestroy, AfterViewInit, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';

import { CdnResource } from '@app/interfaces/cdnResource.interface';
import {
  ConsoleLevel,
  PreviewConsoleService,
} from '@app/services/ui/preview-console.service';
import { PreviewSnapshotService } from '@app/services/ui/preview-snapshot.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { toJpeg } from 'html-to-image';
import { MinioStatusService } from '@app/services/ui/minio-status.service';

@Component({
  selector: 'app-snippet-preview',
  imports: [],
  templateUrl: './snippet-preview.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './snippet-preview.component.scss',
})
export class SnippetPreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  private previewConsole = inject(PreviewConsoleService);
  private previewSnapshot = inject(PreviewSnapshotService);
  private minioStatus = inject(MinioStatusService);
  private destroyRef = inject(DestroyRef);
  private messageListenerAttached = false;

  constructor() {
    fromEvent<MessageEvent>(window, 'message')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.onConsoleMessage(event));
    this.messageListenerAttached = true;
  }

  ngAfterViewInit() {
    if (!this.minioStatus.enabled()) return;
    this.previewSnapshot.register(() => this.captureJpeg());
  }

  updatePreview(
    html: string,
    css: string,
    js: string,
    previewUpdateType: string | null,
    cdnResources: CdnResource[] = []
  ) {
    if (!this.previewIframe) return;

    if (previewUpdateType?.toLocaleLowerCase() === 'partial') {
      this.updateCssOnly(css);
    } else {
      this.fullReload(html, css, js, cdnResources);
    }
  }

  private fullReload(
    html: string,
    css: string,
    js: string,
    cdnResources: CdnResource[] = []
  ) {
    if (!this.previewIframe) return;

    this.previewConsole.clear();

    const iframe = this.previewIframe.nativeElement;

    const stylesheets = cdnResources
      .filter(res => res.resourceType === 'css')
      .map(res => `<link rel="stylesheet" href="${res.url}">`)
      .join('\n');

    const scripts = cdnResources
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
          <style>html, body { margin: 0; min-height: 100%; height: 100%; }</style>
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
    this.previewSnapshot.unregister();
    void this.messageListenerAttached;
  }

  private async captureJpeg(): Promise<Blob | null> {
    const iframe = this.previewIframe?.nativeElement;
    const doc = iframe?.contentDocument;
    const root = doc?.documentElement;
    if (!iframe || !doc || !root) return null;

    try {
      const srcWidth = Math.max(iframe.clientWidth, 1);
      const srcHeight = Math.max(iframe.clientHeight, 1);
      const pixelRatio = Math.min(1, 800 / Math.max(srcWidth, srcHeight));
      const backgroundColor = this.snapshotBackground(doc);

      const dataUrl = await toJpeg(root, {
        quality: 0.8,
        width: srcWidth,
        height: srcHeight,
        pixelRatio,
        cacheBust: true,
        backgroundColor,
        style: {
          width: `${srcWidth}px`,
          height: `${srcHeight}px`,
          margin: '0',
          backgroundColor,
        },
      });
      const res = await fetch(dataUrl);
      return res.blob();
    } catch {
      return null;
    }
  }

  private snapshotBackground(doc: Document): string {
    const raw = doc.defaultView?.getComputedStyle(doc.body).backgroundColor ?? '';
    const transparent = !raw || raw === 'transparent' || raw === 'rgba(0, 0, 0, 0)';
    return transparent ? '#ffffff' : raw;
  }
}
