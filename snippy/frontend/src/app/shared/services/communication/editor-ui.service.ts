import { Injectable, signal } from '@angular/core';

export type EditorLayout = 'top' | 'bottom' | 'left' | 'right';

@Injectable({ providedIn: 'root' })
export class EditorUiService {
  readonly layout = signal<EditorLayout>(this.readStoredLayout());

  setLayout(layout: EditorLayout) {
    this.layout.set(layout);
    localStorage.setItem('editorLayout', layout);
  }

  private readStoredLayout(): EditorLayout {
    const saved = localStorage.getItem('editorLayout') as EditorLayout | null;
    if (saved === 'top' || saved === 'bottom' || saved === 'left' || saved === 'right') {
      return saved;
    }
    return 'top';
  }
}
