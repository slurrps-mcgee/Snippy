import { Injectable, signal, computed } from '@angular/core';
import { Snippet } from '../interfaces/snippet.interface';

@Injectable({ providedIn: 'root' })
export class SnippetStateService {
  snippet = signal<Snippet | null>(null);
  private originalSnippet = signal<Snippet | null>(null);

  // Determine if the snippet has unsaved changes
  isDirty = computed(() => {
    const s = this.snippet();
    const o = this.originalSnippet();
    if (!s || !o) return false;
    if (s.name !== o.name) return true;
    if (s.description !== o.description) return true;
    if (s.isPrivate !== o.isPrivate) return true;
    if (s.tags.length !== o.tags.length) return true;
    for (let i = 0; i < s.tags.length; i++) {
      if (s.tags[i] !== o.tags[i]) return true;
    }
    if (s.snippetFiles.length !== o.snippetFiles.length) return true;
    for (let i = 0; i < s.snippetFiles.length; i++) {
      if (s.snippetFiles[i].content !== o.snippetFiles[i].content) return true;
    }
    return false;
  });

  constructor() { }

  // Set the current snippet
  setSnippet(snippet: Snippet) {
    // Ensure tags is always an array
    if (!snippet.tags) {
      snippet.tags = [];
    }

    this.snippet.set(snippet);
    this.originalSnippet.set(JSON.parse(JSON.stringify(snippet)));
  }

  // Update the content of a specific snippet file
  updateSnippetFile(fileType: string, content: string) {
    this.snippet.update(s => ({
      ...s!,
      snippetFiles: s!.snippetFiles.map(f =>
        f.fileType === fileType ? { ...f, content } : f
      )
    }));
    console.log(`Updated ${fileType} file content`);
  }

  // Update snippet name
  updateSnippetName(name: string) {
    this.snippet.update(s => ({ ...s!, name }));
    console.log('Updated snippet name to', name);
  }

  // Update snippet settings: description, isPrivate, tags
  updateSnippetSettings(settings: { description: string; isPrivate: boolean; tags: string[] }) {
    this.snippet.update(s => ({
      ...s!,
      description: settings.description,
      isPrivate: settings.isPrivate,
      tags: settings.tags
    }));
    console.log('Updated snippet settings:', settings);
  }

  // Clear the current snippet
  clearSnippet() {
    this.snippet.set(null);
    this.originalSnippet.set(null);
  }

  // Get current snippet synchronously
  getSnippet(): Snippet | null {
    return this.snippet();
  }
}
