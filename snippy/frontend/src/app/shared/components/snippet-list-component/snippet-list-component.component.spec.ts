import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetListComponentComponent } from './snippet-list-component.component';

describe('SnippetListComponentComponent', () => {
  let component: SnippetListComponentComponent;
  let fixture: ComponentFixture<SnippetListComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetListComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnippetListComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
