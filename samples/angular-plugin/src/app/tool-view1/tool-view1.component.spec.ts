import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolView1Component } from './tool-view1.component';

describe('ToolView1Component', () => {
  let component: ToolView1Component;
  let fixture: ComponentFixture<ToolView1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolView1Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolView1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
