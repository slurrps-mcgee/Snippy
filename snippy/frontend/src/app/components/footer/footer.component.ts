import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import JSZip from 'jszip';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { AssetsDialogComponent } from '@app/components/dialogs/assets-dialog/assets-dialog.component';
import { SnackbarService } from '@app/services/ui/snackbar.service';
import { DialogService } from '@app/services/ui/dialog.service';
import { SnippetActionsService } from '@app/services/ui/snippet-actions.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  snippetStoreService = inject(SnippetStoreService);
  private dialogService = inject(DialogService);
  private snippetActions = inject(SnippetActionsService);
  private snackbar = inject(SnackbarService);

  readonly githubUrl = 'https://github.com/slurrps-mcgee/Snippy';
  readonly licenseUrl = 'https://github.com/slurrps-mcgee/Snippy/blob/main/LICENSE';

  openAssets() {
    this.dialogService.open(AssetsDialogComponent, 'lg');
  }

  forkSnippet() {
    const snippet = this.snippetStoreService.snippet();
    if (!snippet?.snippetId) return;
    void this.snippetActions.forkAndOpen(snippet.snippetId);
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
