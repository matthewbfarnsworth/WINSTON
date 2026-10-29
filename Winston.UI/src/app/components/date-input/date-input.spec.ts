import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateInput } from './date-input';

describe('DateInput', () => {
  let component: DateInput;
  let fixture: ComponentFixture<DateInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInput],
    }).compileComponents();

    fixture = TestBed.createComponent(DateInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the supplied date', () => {
    fixture.componentRef.setInput('value', '2026-10-29');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('2026-10-29');
  });

  it('updates the date when the input changes', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '2026-11-01';

    input.dispatchEvent(new Event('change'));

    expect(component.value()).toBe('2026-11-01');
  });
});
