/**
 * Keep theme/font keys in sync with snippy/frontend/src/app/editor/editor-preferences.ts.
 * Do not extract a shared package — HTTP JSON is the contract.
 */
export const EDITOR_THEME_KEYS = [
  'one-dark',
  'light',
  'dracula',
  'github-dark',
  'solarized-dark',
  'solarized-light',
  'material-dark',
] as const;
export type EditorThemeKey = (typeof EDITOR_THEME_KEYS)[number];

export const EDITOR_FONT_KEYS = [
  'monospace',
  'fira-code',
  'jetbrains-mono',
  'source-code-pro',
] as const;
export type EditorFontKey = (typeof EDITOR_FONT_KEYS)[number];

export const EDITOR_KEYMAP_KEYS = ['default', 'vim'] as const;
export type EditorKeymapKey = (typeof EDITOR_KEYMAP_KEYS)[number];

export interface EditorPreferences {
  fontSize: number;
  fontFamily: EditorFontKey | string;
  indentWith: 'spaces' | 'tabs';
  indentWidth: number;
  lineNumbers: boolean;
  lineWrapping: boolean;
  codeFolding: boolean;
  autocomplete: boolean;
  matchBrackets: boolean;
  theme: EditorThemeKey | string;
  keymap: EditorKeymapKey | string;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 15,
  fontFamily: 'monospace',
  indentWith: 'spaces',
  indentWidth: 2,
  lineNumbers: true,
  lineWrapping: true,
  codeFolding: true,
  autocomplete: true,
  matchBrackets: true,
  theme: 'one-dark',
  keymap: 'default',
};

export function mergeEditorPreferences(
  stored: Partial<EditorPreferences> | null | undefined
): EditorPreferences {
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_EDITOR_PREFERENCES };
  }
  return {
    ...DEFAULT_EDITOR_PREFERENCES,
    ...stored,
  };
}
