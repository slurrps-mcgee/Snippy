import { Injectable } from '@angular/core';
import { EditorView } from '@codemirror/view';
export type EditorPane = 'html' | 'css' | 'js';

/**
 * Lets the assets dialog insert at the CodeMirror caret. Editors register
 * their views on init and unregister on destroy.
 */
@Injectable({ providedIn: 'root' })
export class EditorInsertService {
  private views = new Map<EditorPane, EditorView>();

  register(pane: EditorPane, view: EditorView) {
    this.views.set(pane, view);
  }

  unregister(pane: EditorPane, view: EditorView) {
    if (this.views.get(pane) === view) {
      this.views.delete(pane);
    }
  }

  insertAtCursor(pane: EditorPane, text: string): boolean {
    const view = this.views.get(pane);
    if (!view) return false;
    const pos = view.state.selection.main.head;
    view.dispatch({
      changes: { from: pos, insert: text },
      selection: { anchor: pos + text.length },
      scrollIntoView: true,
    });
    view.focus();
    return true;
  }
}
