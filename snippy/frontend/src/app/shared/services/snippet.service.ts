import { Injectable, signal, computed } from '@angular/core';
import { Snippet } from '../interfaces/snippet.interface';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';
import { SnippetResponse } from '../interfaces/snippetResponse.interface';
import { SnackbarService } from './snackbar.service';

@Injectable({ providedIn: 'root' })
export class SnippetService {
  snippet = signal<Snippet | null>(null);
  private originalSnippet = signal<Snippet | null>(null);

  constructor(private apiService: ApiService, private snackbarService: SnackbarService) { }

  isDirty = computed(() => {
    const s = this.snippet();
    const o = this.originalSnippet();
    if (!s || !o) return false;
    if (s.name !== o.name) return true;
    if (s.snippetFiles.length !== o.snippetFiles.length) return true;
    for (let i = 0; i < s.snippetFiles.length; i++) {
      if (s.snippetFiles[i].content !== o.snippetFiles[i].content) return true;
    }
    return false;
  });

  fetchSnippet(shortId: string): Observable<SnippetResponse> {
    return this.apiService.request<SnippetResponse>({
      path: `/snippets/${shortId}`,
      method: 'GET'
    }).pipe(
      tap(response => this.setSnippet(response.snippet))
    );
  }

  setSnippet(snippet: Snippet) {
    // Ensure tags is always an array
    if (!snippet.tags) {
      snippet.tags = [];
    }

    this.snippet.set(snippet);
    this.originalSnippet.set(JSON.parse(JSON.stringify(snippet)));
  }

  updateSnippetFile(fileType: string, content: string) {
    this.snippet.update(s => ({
      ...s!,
      snippetFiles: s!.snippetFiles.map(f =>
        f.fileType === fileType ? { ...f, content } : f
      )
    }));
    console.log(`Updated ${fileType} file content`);
  }

  updateSnippetName(name: string) {
    this.snippet.update(s => ({ ...s!, name }));
    console.log('Updated snippet name to', name);
  }

  saveSnippet(): Observable<SnippetResponse> {
    const s = this.snippet();
    if (!s) throw new Error('No snippet to save');

    console.log('SnippetFiles being saved:', s.snippetFiles);


    if (!s.shortId) {
      // New snippet - create
      return this.apiService.request<SnippetResponse>({
        path: `/snippets`,
        method: 'POST',
        body: {
          name: s.name,
          description: s.description,
          tags: s.tags,
          isPrivate: s.isPrivate,
          snippetFiles: s.snippetFiles
        }
      }).pipe(
        tap((response) => {
          // Update the snippet with the returned data (including shortId)
          this.setSnippet(response.snippet);
          this.snackbarService.success('Snippet saved successfully');
        })
      );
    }
    else {
      // Existing snippet - update
      return this.apiService.request<SnippetResponse>({
        path: `/snippets/${s.shortId}`,
        method: 'PUT',
        body: {
          name: s.name,
          description: s.description,
          tags: s.tags,
          isPrivate: s.isPrivate,
          snippetFiles: s.snippetFiles
        }
      }).pipe(
        tap((response) => {
          this.setSnippet(response.snippet);
          this.snackbarService.success('Snippet saved successfully');
        })
      );
    }
  }

  clearSnippet() {
    this.snippet.set(null);
    this.originalSnippet.set(null);
  }
}