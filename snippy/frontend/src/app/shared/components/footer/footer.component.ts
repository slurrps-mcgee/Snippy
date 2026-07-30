import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import JSZip from 'jszip';
import { SnippetStoreService } from '../../services/store.services/snippet.store.service';
import { AuthStoreService } from '../../services/store.services/authStore.service';
import { AssetsDialogComponent } from '../dialogs/assets-dialog/assets-dialog.component';
import { SnackbarService } from '../../services/component.services/snackbar.service';
import { DialogService } from '../../services/component.services/dialog.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  snippetStoreService = inject(SnippetStoreService);
  private authStore = inject(AuthStoreService);
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  openAssets() {
    this.dialogService.open(AssetsDialogComponent, 'lg');
  }

  async forkSnippet() {
    const snippet = this.snippetStoreService.snippet();
    if (!snippet?.snippetId) return;
    try {
      const res = await this.snippetStoreService.forkSnippet(snippet.snippetId);
      this.snackbar.success('Snippet forked');
      const user = this.authStore.user()?.userName || res.snippet.userName || 'me';
      this.router.navigate([user, 'snippet', res.snippet.shortId]);
    } catch {
      this.snackbar.error('Failed to fork snippet');
    }
  }

  async exportZip() {
    const snippet = this.snippetStoreService.snippet();
    if (!snippet) return;

    const zip = new JSZip();
    const html = snippet.snippetFiles.find(f => f.fileType === 'html')?.content ?? '';
    const css = snippet.snippetFiles.find(f => f.fileType === 'css')?.content ?? '';
    const js = snippet.snippetFiles.find(f => f.fileType === 'js')?.content ?? '';

    zip.file('index.html', html);
    zip.file('style.css', css);
    zip.file('script.js', js);
    zip.file(
      'README.txt',
      `Snippy export: ${snippet.name}\n${snippet.description || ''}\n`
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (snippet.name || 'snippet').replace(/[^\w.\-]+/g, '_');
    a.href = url;
    a.download = `${safeName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    this.snackbar.success('Exported ZIP');
  }
}
