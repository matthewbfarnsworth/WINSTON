import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRow } from './list-row';

describe('ListRow', () => {
  let component: ListRow;
  let fixture: ComponentFixture<ListRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListRow],
    }).compileComponents();

    fixture = TestBed.createComponent(ListRow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
