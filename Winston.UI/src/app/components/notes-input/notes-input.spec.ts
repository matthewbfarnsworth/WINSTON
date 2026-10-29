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

  it('renders the configured row count', () => {
    fixture.componentRef.setInput('rows', 5);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.rows).toBe(5);
  });

  it('updates the notes while typing', () => {
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Shared hotel room';

    textarea.dispatchEvent(new Event('input'));

    expect(component.value()).toBe('Shared hotel room');
  });
});
