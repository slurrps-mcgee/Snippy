import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetDetailsComponentComponent } from './snippet-details-component.component';

describe('SnippetDetailsComponentComponent', () => {
  let component: SnippetDetailsComponentComponent;
  let fixture: ComponentFixture<SnippetDetailsComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetDetailsComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnippetDetailsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
