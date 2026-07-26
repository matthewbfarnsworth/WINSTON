import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkButton } from './link-button';

describe('LinkButton', () => {
  let component: LinkButton;
  let fixture: ComponentFixture<LinkButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkButton],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
