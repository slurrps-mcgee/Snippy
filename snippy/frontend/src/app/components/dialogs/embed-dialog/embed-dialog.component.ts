import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { SnackbarService } from '@app/services/ui/snackbar.service';
import { EditorUiService } from '@app/services/ui/editor-ui.service';

export type EmbedTabOption = 'html' | 'css' | 'js' | 'result';

@Component({
  selector: 'app-embed-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './embed-dialog.component.html',
  styleUrl: './embed-dialog.component.scss',
})
export class EmbedDialogComponent {
  private dialogRef = inject(MatDialogRef<EmbedDialogComponent>);
  private snippetStore = inject(SnippetStoreService);
  private snackbar = inject(SnackbarService);
  private sanitizer = inject(DomSanitizer);
  private editorUi = inject(EditorUiService);

  height = signal(300);
  editable = signal(false);
  defaultTabs = signal<EmbedTabOption[]>(['html', 'result']);

  readonly canEmbed = computed(() => {
    if (this.editorUi.guestMode()) return false;
    const s = this.snippetStore.snippet();
    return !!s?.shortId && !!s.snippetId && !s.isPrivate;
  });

  readonly blockReason = computed(() => {
    if (this.editorUi.guestMode()) {
      return 'Sign in and save a public snippet to get embed code.';
    }
    const s = this.snippetStore.snippet();
    if (!s?.snippetId || !s.shortId) {
      return 'Save your snippet first to generate embed code.';
    }
    if (s.isPrivate) {
      return 'Make this snippet public in Settings to enable embedding.';
    }
    return '';
  });

  readonly embedUrl = computed(() => {
    const s = this.snippetStore.snippet();
    if (!s?.shortId) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const tabs = this.defaultTabs().join(',') || 'result';
    const params = new URLSearchParams({
      'default-tab': tabs,
      editable: String(this.editable()),
    });
    return `${origin}/embed/${s.shortId}?${params.toString()}`;
  });

  readonly safeEmbedUrl = computed((): SafeResourceUrl | null => {
    const url = this.embedUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly embedCode = computed(() => {
    const s = this.snippetStore.snippet();
    const url = this.embedUrl();
    if (!url || !s) return '';
    const title = (s.name || 'Snippy snippet')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const h = this.height();
    return `<iframe
  src="${url}"
  style="width:100%;height:${h}px;border:0;"
  title="${title}"
  loading="lazy"
  allowfullscreen>
</iframe>`;
  });

  onHeightChange(value: number) {
    this.height.set(value);
  }

  onEditableChange(value: boolean) {
    this.editable.set(value);
  }

  isTabSelected(tab: EmbedTabOption): boolean {
    return this.defaultTabs().includes(tab);
  }

  toggleTab(tab: EmbedTabOption) {
    const current = this.defaultTabs();
    if (current.includes(tab)) {
      if (current.length === 1) return;
      this.defaultTabs.set(current.filter(t => t !== tab));
    } else {
      this.defaultTabs.set([...current, tab]);
    }
  }

  async copyCode() {
    const code = this.embedCode();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      this.snackbar.success('Embed code copied');
    } catch {
      this.snackbar.error('Failed to copy embed code');
    }
  }

  close() {
    this.dialogRef.close();
  }
}
