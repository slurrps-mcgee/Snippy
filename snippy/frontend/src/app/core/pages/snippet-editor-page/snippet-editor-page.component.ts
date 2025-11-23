import { Component } from '@angular/core';
import { SnippetCodeEditorComponentComponent } from "../../../shared/components/snippet-code-editor-component/snippet-code-editor-component.component";

@Component({
  selector: 'app-snippet-editor-page',
  imports: [SnippetCodeEditorComponentComponent],
  templateUrl: './snippet-editor-page.component.html',
  styleUrl: './snippet-editor-page.component.scss'
})
export class SnippetEditorPageComponent {

}
