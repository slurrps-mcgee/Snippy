import { Component, inject, OnInit, OnDestroy, ViewChild, effect, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnippetPreviewComponent } from "@app/components/editor/snippet-preview/snippet-preview.component";
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-fullpage-view',
  imports: [SnippetPreviewComponent],
  templateUrl: './fullpage-view.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './fullpage-view.component.scss',
})
export class FullpageViewComponent implements OnInit, OnDestroy {
  @ViewChild(SnippetPreviewComponent) previewComponent?: SnippetPreviewComponent;

  snippetStoreService = inject(SnippetStoreService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  snippetId: string | null = null;
  private viewRecorded = false;

  constructor() {
    effect(() => {
      const snippet = this.snippetStoreService.snippet();
      const previewUpdateType = this.snippetStoreService.previewUpdateType();

      if (snippet && this.previewComponent) {
        const files = snippet.snippetFiles ?? [];
        const htmlFile = files.find(f => f.fileType === 'html');
        const cssFile = files.find(f => f.fileType === 'css');
        const jsFile = files.find(f => f.fileType === 'js');

        this.previewComponent.updatePreview(
          htmlFile?.content || '',
          cssFile?.content || '',
          jsFile?.content || '',
          previewUpdateType,
          snippet.cdnResources || []
        );
      }
    });

    effect(() => {
      const snippet = this.snippetStoreService.snippet();
      if (!snippet?.snippetId || snippet.isOwner || this.viewRecorded) return;
      this.viewRecorded = true;
      void this.snippetStoreService.recordView(snippet.snippetId);
    });
  }

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        this.snippetId = id;
        this.viewRecorded = false;
        if (id) {
          void this.snippetStoreService.loadSnippet(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.snippetStoreService.clearSnippet();
  }
}
