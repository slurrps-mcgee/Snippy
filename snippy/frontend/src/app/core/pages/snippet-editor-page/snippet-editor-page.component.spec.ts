import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetEditorPageComponent } from './snippet-editor-page.component';

describe('SnippetEditorPageComponent', () => {
  let component: SnippetEditorPageComponent;
  let fixture: ComponentFixture<SnippetEditorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetEditorPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnippetEditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
