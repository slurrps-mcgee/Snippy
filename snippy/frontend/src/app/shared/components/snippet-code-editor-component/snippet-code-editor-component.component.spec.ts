import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetCodeEditorComponentComponent } from './snippet-code-editor-component.component';

describe('SnippetCodeEditorComponentComponent', () => {
  let component: SnippetCodeEditorComponentComponent;
  let fixture: ComponentFixture<SnippetCodeEditorComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetCodeEditorComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnippetCodeEditorComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
