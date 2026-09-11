import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EDITOR_PREFERENCES,
  mergeEditorPreferences,
} from '../../common/utilities/editor-preferences';

describe('mergeEditorPreferences', () => {
  it('returns defaults when stored prefs are missing', () => {
    expect(mergeEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(mergeEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it('overlays stored values onto defaults', () => {
    const merged = mergeEditorPreferences({ fontSize: 20, keymap: 'vim' });
    expect(merged.fontSize).toBe(20);
    expect(merged.keymap).toBe('vim');
    expect(merged.theme).toBe(DEFAULT_EDITOR_PREFERENCES.theme);
    expect(merged.lineNumbers).toBe(true);
  });
});
