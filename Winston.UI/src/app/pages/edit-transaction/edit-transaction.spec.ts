import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTransaction } from './edit-transaction';

describe('EditTransaction', () => {
  let component: EditTransaction;
  let fixture: ComponentFixture<EditTransaction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTransaction],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTransaction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
