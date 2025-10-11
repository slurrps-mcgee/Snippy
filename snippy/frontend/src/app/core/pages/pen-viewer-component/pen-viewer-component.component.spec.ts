import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PenViewerComponentComponent } from './pen-viewer-component.component';

describe('PenViewerComponentComponent', () => {
  let component: PenViewerComponentComponent;
  let fixture: ComponentFixture<PenViewerComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PenViewerComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PenViewerComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
