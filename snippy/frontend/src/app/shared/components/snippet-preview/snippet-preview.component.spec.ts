import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetPreviewComponent } from './snippet-preview.component';

describe('SnippetPreviewComponent', () => {
  let component: SnippetPreviewComponent;
  let fixture: ComponentFixture<SnippetPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnippetPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
