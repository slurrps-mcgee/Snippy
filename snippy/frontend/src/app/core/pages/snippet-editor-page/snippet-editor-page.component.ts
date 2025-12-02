import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SnippetCodeEditorComponentComponent } from "../../../shared/components/snippet-code-editor-component/snippet-code-editor-component.component";
import { ActivatedRoute } from '@angular/router';
import { SnippetService } from '../../../shared/services/snippet.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-snippet-editor-page',
  imports: [SnippetCodeEditorComponentComponent, CommonModule],
  templateUrl: './snippet-editor-page.component.html',
  styleUrl: './snippet-editor-page.component.scss'
})
export class SnippetEditorPageComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor?: SnippetCodeEditorComponentComponent;
  
  username: string | null = null;
  snippetId: string | null = null;
  loading = true;
  error: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    public snippetService: SnippetService
  ) { }

  ngOnInit(): void {
    this.username = this.route.snapshot.paramMap.get('username');
    this.snippetId = this.route.snapshot.paramMap.get('id');

    if (this.snippetId) {
      this.snippetService.fetchSnippet(this.snippetId).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load snippet:', err);
          this.error = 'Failed to load snippet';
          this.loading = false;
        }
      });
    } else {
      // No snippet ID - create a new empty snippet
      this.snippetService.setSnippet({
        shortId: '',
        name: 'Untitled Snippet',
        description: '',
        tags: [],
        isPrivate: false,
        forkCount: 0,
        viewCount: 0,
        commentCount: 0,
        favoriteCount: 0,
        parentShortId: '',
        isOwner: true,
        snippetFiles: [
          { fileType: 'html', content: '' },
          { fileType: 'css', content: '' },
          { fileType: 'js', content: '' }
        ]
      });
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.snippetService.clearSnippet();
  }
}
