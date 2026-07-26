import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesInput } from './notes-input';

describe('NotesInput', () => {
  let component: NotesInput;
  let fixture: ComponentFixture<NotesInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesInput],
    }).compileComponents();

    fixture = TestBed.createComponent(NotesInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
