import { Component, inject, OnInit, ViewChild, effect } from '@angular/core';
import { SnippetPreviewComponent } from "../../../../core/components/snippet-preview/snippet-preview.component";
import { SnippetStoreService } from '../../../services/store.services/snippet.store.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserMenuComponent } from "../../modules/user-menu/user-menu.component";

@Component({
  selector: 'app-fullpage-view',
  imports: [SnippetPreviewComponent, RouterModule, UserMenuComponent],
  templateUrl: './fullpage-view.component.html',
  styleUrl: './fullpage-view.component.scss',
})
export class FullpageViewComponent implements OnInit {
  @ViewChild(SnippetPreviewComponent) previewComponent?: SnippetPreviewComponent;

  snippetStoreService = inject(SnippetStoreService);
  private route = inject(ActivatedRoute);

  snippetId: string | null = null;

  constructor() {
    // React to snippet changes after load completes
    effect(() => {
      const snippet = this.snippetStoreService.snippet();
      const previewUpdateType = this.snippetStoreService.previewUpdateType();

      if (snippet && this.previewComponent) {
        const htmlFile = snippet.snippetFiles.find(f => f.fileType === 'html');
        const cssFile = snippet.snippetFiles.find(f => f.fileType === 'css');
        const jsFile = snippet.snippetFiles.find(f => f.fileType === 'js');

        console.log('Preview updated with loaded snippet', { htmlFile, cssFile, jsFile, previewUpdateType });

        this.previewComponent.updatePreview(
          htmlFile?.content || '',
          cssFile?.content || '',
          jsFile?.content || '',
          previewUpdateType,
          snippet.externalResources || []
        );
      }
    });
  }

  ngOnInit() {
    this.snippetId = this.route.snapshot.paramMap.get('id');

    if (this.snippetId) {
      this.snippetStoreService.loadSnippet(this.snippetId);
    }
  }
}
