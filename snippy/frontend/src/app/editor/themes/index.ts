import { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { EditorThemeKey } from '../editor-preferences';

const lightTheme = EditorView.theme(
  {
    '&': {
      color: '#24292e',
      backgroundColor: '#ffffff',
    },
    '.cm-content': {
      caretColor: '#044289',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#044289',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#c8e1ff',
    },
    '.cm-activeLine': {
      backgroundColor: '#f6f8fa',
    },
    '.cm-gutters': {
      backgroundColor: '#f6f8fa',
      color: '#6a737d',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#eaecef',
    },
  },
  { dark: false }
);

const draculaTheme = EditorView.theme(
  {
    '&': {
      color: '#f8f8f2',
      backgroundColor: '#282a36',
    },
    '.cm-content': {
      caretColor: '#f8f8f2',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#f8f8f2',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#44475a',
    },
    '.cm-activeLine': {
      backgroundColor: '#44475a55',
    },
    '.cm-gutters': {
      backgroundColor: '#21222c',
      color: '#6272a4',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#44475a',
    },
  },
  { dark: true }
);

export interface EditorThemeOption {
  key: EditorThemeKey;
  label: string;
  group: 'dark' | 'light';
  extension: Extension;
}

export const EDITOR_THEMES: EditorThemeOption[] = [
  { key: 'one-dark', label: 'One Dark', group: 'dark', extension: oneDark },
  { key: 'dracula', label: 'Dracula', group: 'dark', extension: draculaTheme },
  { key: 'light', label: 'Light', group: 'light', extension: lightTheme },
];

export function getThemeExtension(themeKey: string): Extension {
  return EDITOR_THEMES.find(t => t.key === themeKey)?.extension ?? oneDark;
}
