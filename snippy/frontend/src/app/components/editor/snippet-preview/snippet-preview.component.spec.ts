import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  dataUrlToBlob,
  SnippetPreviewComponent,
} from '@app/components/editor/snippet-preview/snippet-preview.component';

describe('SnippetPreviewComponent', () => {
  let component: SnippetPreviewComponent;
  let fixture: ComponentFixture<SnippetPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SnippetPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('dataUrlToBlob', () => {
  it('decodes a JPEG data URL without fetch', async () => {
    const dataUrl = 'data:image/jpeg;base64,QQ==';
    const blob = dataUrlToBlob(dataUrl);
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).toBe(1);
    expect(await blob.text()).toBe('A');
  });

  it('rejects a string that is not a data URL', () => {
    expect(() => dataUrlToBlob('not-a-data-url')).toThrow('Invalid data URL');
  });
});
