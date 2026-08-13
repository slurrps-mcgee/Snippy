import { Injectable, signal } from '@angular/core';

export type EditorLayout = 'top' | 'bottom' | 'left' | 'right';

@Injectable({ providedIn: 'root' })
export class EditorUiService {
  readonly layout = signal<EditorLayout>(this.readStoredLayout());
  /** True on the public /try guest playground (no auth / no save). */
  readonly guestMode = signal(false);

  setLayout(layout: EditorLayout) {
    this.layout.set(layout);
    localStorage.setItem('editorLayout', layout);
  }

  setGuestMode(guest: boolean) {
    this.guestMode.set(guest);
  }

  private readStoredLayout(): EditorLayout {
    const saved = localStorage.getItem('editorLayout') as EditorLayout | null;
    if (saved === 'top' || saved === 'bottom' || saved === 'left' || saved === 'right') {
      return saved;
    }
    return 'top';
  }
}
