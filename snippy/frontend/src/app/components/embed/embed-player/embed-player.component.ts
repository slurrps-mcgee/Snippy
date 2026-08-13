import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SnippetAPIService } from '@app/services/api/snippet.api.service';
import { Snippet } from '@app/interfaces/snippet.interface';
import { ExternalResource } from '@app/interfaces/externalResource.interface';
import { SnippetPreviewComponent } from '@app/components/editor/snippet-preview/snippet-preview.component';
import { EmbedCodePaneComponent } from '@app/components/embed/embed-code-pane/embed-code-pane.component';

export type EmbedTab = 'html' | 'css' | 'js' | 'result';
export type EmbedZoom = 1 | 0.5 | 0.25;

@Component({
  selector: 'app-embed-player',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    SnippetPreviewComponent,
    EmbedCodePaneComponent,
  ],
  templateUrl: './embed-player.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './embed-player.component.scss',
})
export class EmbedPlayerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(SnippetPreviewComponent) preview?: SnippetPreviewComponent;

  private route = inject(ActivatedRoute);
  private api = inject(SnippetAPIService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  error = signal<string | null>(null);
  snippet = signal<Snippet | null>(null);

  html = signal('');
  css = signal('');
  js = signal('');
  resources = signal<ExternalResource[]>([]);

  editable = signal(false);
  enabledTabs = signal<EmbedTab[]>(['html', 'result']);
  activeCodeTab = signal<'html' | 'css' | 'js'>('html');
  showResult = signal(true);
  showResources = signal(false);
  zoom = signal<EmbedZoom>(1);
  previewTick = signal(0);

  readonly codeTabs = computed(() =>
    (['html', 'css', 'js'] as const).filter(t => this.enabledTabs().includes(t))
  );

  readonly cssResources = computed(() =>
    this.resources().filter(r => r.resourceType === 'css')
  );

  readonly jsResources = computed(() =>
    this.resources().filter(r => r.resourceType === 'js')
  );

  readonly showCodePane = computed(() => this.codeTabs().length > 0);
  readonly editUrl = computed(() => {
    const s = this.snippet();
    if (!s?.shortId) return '/try';
    if (s.userName) return `/${s.userName}/snippet/${s.shortId}`;
    return `/snippet`;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const shortId = params.get('shortId');
      if (shortId) void this.load(shortId);
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      this.editable.set(q.get('editable') === 'true');
      const raw = (q.get('default-tab') || 'html,result').toLowerCase();
      const tabs = raw
        .split(',')
        .map(t => t.trim())
        .filter((t): t is EmbedTab => ['html', 'css', 'js', 'result'].includes(t));
      const enabled = tabs.length ? [...new Set(tabs)] : (['html', 'result'] as EmbedTab[]);
      this.enabledTabs.set(enabled);
      this.showResult.set(enabled.includes('result'));
      const firstCode = (['html', 'css', 'js'] as const).find(t => enabled.includes(t));
      if (firstCode) this.activeCodeTab.set(firstCode);
    });
  }

  ngAfterViewInit() {
    this.refreshPreview();
  }

  ngOnDestroy() {}

  selectCodeTab(tab: 'html' | 'css' | 'js') {
    this.activeCodeTab.set(tab);
    this.showResources.set(false);
  }

  toggleResources() {
    this.showResources.update(v => !v);
  }

  setZoom(z: EmbedZoom) {
    this.zoom.set(z);
  }

  rerun() {
    this.previewTick.update(n => n + 1);
    this.refreshPreview();
  }

  onCodeChange(tab: 'html' | 'css' | 'js', value: string) {
    if (!this.editable()) return;
    if (tab === 'html') this.html.set(value);
    if (tab === 'css') this.css.set(value);
    if (tab === 'js') this.js.set(value);
    this.refreshPreview(tab === 'css' ? 'partial' : 'full');
  }

  private async load(shortId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.getSnippet(shortId));
      const snip = res.snippet;
      this.snippet.set(snip);
      this.html.set(snip.snippetFiles?.find(f => f.fileType === 'html')?.content ?? '');
      this.css.set(snip.snippetFiles?.find(f => f.fileType === 'css')?.content ?? '');
      this.js.set(snip.snippetFiles?.find(f => f.fileType === 'js')?.content ?? '');
      this.resources.set(snip.externalResources ?? []);
      this.loading.set(false);
      queueMicrotask(() => this.refreshPreview());
    } catch {
      this.error.set('Snippet not found or is private.');
      this.loading.set(false);
    }
  }

  private refreshPreview(type: 'full' | 'partial' = 'full') {
    if (!this.preview) {
      setTimeout(() => this.refreshPreview(type), 50);
      return;
    }
    this.preview.updatePreview(
      this.html(),
      this.css(),
      this.js(),
      type,
      this.resources()
    );
  }
}
