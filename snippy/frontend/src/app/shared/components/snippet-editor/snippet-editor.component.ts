import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Output, EventEmitter, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { SnippetService } from '../../services/snippet.service';

@Component({
  selector: 'app-snippet-editor',
  imports: [CommonModule, MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './snippet-editor.component.html',
  styleUrl: './snippet-editor.component.scss',
})
export class SnippetEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  // Inputs for editor type and initial content
  @Input() editorType: 'html' | 'css' | 'js' = 'html';
  @Input() fileContent: string = '';
  // Reference to the editor container
  @ViewChild('editor', { static: false }) editorRef?: ElementRef<HTMLDivElement>;
  // Output event for code changes
  @Output() codeChange = new EventEmitter<string>();

  // CodeMirror editor instance
  private editorInstance?: EditorView;

  // Code content signal
  private code = signal('');

  constructor(private snippetService: SnippetService) {}

  ngOnInit() {
    // Initialize code from input
    this.code.set(this.fileContent);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // Initialize the CodeMirror editor
      this.initializeEditor();
    }, 0);
  }

  ngOnDestroy() {
    // Clean up editor instance
    this.editorInstance?.destroy();
  }

  // Initialize CodeMirror editor based on type
  private initializeEditor() {
    if (!this.editorRef) return;

    // Get language extension
    const languageExtension = this.getLanguageExtension();

    // Create editor instance
    this.editorInstance = new EditorView({
      state: EditorState.create({
        doc: this.code(),
        extensions: [
          basicSetup,
          languageExtension,
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const value = update.state.doc.toString();
              this.code.set(value);
              this.codeChange.emit(value);
              this.snippetService.updateSnippetFile(this.editorType, value);
            }
          })
        ]
      }),
      parent: this.editorRef.nativeElement
    });
  }

  // Get language extension based on editor type
  private getLanguageExtension() {
    switch (this.editorType) {
      case 'html':
        return html();
      case 'css':
        return css();
      case 'js':
        return javascript();
      default:
        return html();
    }
  }

  // Format code
  formatCode() {
    if (!this.editorInstance) return;

    const formatted = this.basicFormat(this.code(), this.editorType);
    
    // Update the editor content
    this.editorInstance.dispatch({
      changes: { from: 0, to: this.editorInstance.state.doc.length, insert: formatted }
    });
  }

  // Basic code formatter
  private basicFormat(code: string, type: 'html' | 'css' | 'js'): string {
    if (!code.trim()) return code;

    try {
      if (type === 'css') {
        return this.formatCSS(code);
      } else if (type === 'js') {
        return this.formatJS(code);
      } else if (type === 'html') {
        return this.formatHTML(code);
      }
    } catch (e) {
      console.error('Format error:', e);
    }
    return code;
  }

  private formatHTML(html: string): string {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    
    html.split(/(<[^>]+>)/g).forEach(part => {
      if (part.trim() === '') return;
      
      if (part.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        formatted += tab.repeat(indent) + part.trim() + '\n';
      } else if (part.startsWith('<') && !part.startsWith('<!') && !part.endsWith('/>')) {
        formatted += tab.repeat(indent) + part.trim() + '\n';
        if (!part.match(/<(br|hr|img|input|link|meta|area|base|col|command|embed|keygen|param|source|track|wbr)/)) {
          indent++;
        }
      } else if (part.startsWith('<')) {
        formatted += tab.repeat(indent) + part.trim() + '\n';
      } else {
        formatted += tab.repeat(indent) + part.trim() + '\n';
      }
    });
    
    return formatted.trim();
  }

  private formatCSS(css: string): string {
    return css
      .replace(/\s*\{\s*/g, ' {\n  ')
      .replace(/\s*\}\s*/g, '\n}\n')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private formatJS(js: string): string {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    
    js.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.endsWith('{')) {
        formatted += tab.repeat(indent) + trimmed + '\n';
        indent++;
      } else if (trimmed.startsWith('}')) {
        indent = Math.max(0, indent - 1);
        formatted += tab.repeat(indent) + trimmed + '\n';
      } else {
        formatted += tab.repeat(indent) + trimmed + '\n';
      }
    });
    
    return formatted.trim();
  }

  // Analyze code (check for issues)
  analyzeCode() {
    let issues: string[] = [];

    switch (this.editorType) {
      case 'html':
        issues = this.analyzeHTML(this.code());
        break;
      case 'css':
        issues = this.analyzeCSS(this.code());
        break;
      case 'js':
        issues = this.analyzeJS(this.code());
        break;
    }

    if (issues.length === 0) {
      alert(`No issues found in ${this.editorType.toUpperCase()}`);
    } else {
      alert(`Issues found in ${this.editorType.toUpperCase()}:\n\n` + issues.join('\n'));
    }
  }

  private analyzeHTML(html: string): string[] {
    const issues: string[] = [];
    
    // Check for unclosed tags
    const openTags = html.match(/<([a-z]+)[^>]*>/gi) || [];
    const closeTags = html.match(/<\/([a-z]+)>/gi) || [];
    
    if (openTags.length !== closeTags.length) {
      issues.push('Potential unclosed tags detected');
    }
    
    return issues;
  }

  private analyzeCSS(css: string): string[] {
    const issues: string[] = [];
    
    // Check for missing semicolons
    const rules = css.match(/[^{}]+\{[^}]*\}/g) || [];
    rules.forEach(rule => {
      const declarations = rule.match(/\{([^}]*)\}/)?.[1] || '';
      const lines = declarations.split(';').filter(l => l.trim());
      lines.forEach(line => {
        if (line.trim() && !line.includes(':')) {
          issues.push('Invalid CSS declaration: ' + line.trim());
        }
      });
    });
    
    return issues;
  }

  private analyzeJS(js: string): string[] {
    const issues: string[] = [];
    
    // Basic syntax checks
    const openBraces = (js.match(/\{/g) || []).length;
    const closeBraces = (js.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      issues.push('Mismatched braces detected');
    }
    
    const openParens = (js.match(/\(/g) || []).length;
    const closeParens = (js.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      issues.push('Mismatched parentheses detected');
    }
    
    return issues;
  }
}