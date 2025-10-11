import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetViewPageComponent } from './snippet-view-page.component';

describe('SnippetViewPageComponent', () => {
  let component: SnippetViewPageComponent;
  let fixture: ComponentFixture<SnippetViewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetViewPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnippetViewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
