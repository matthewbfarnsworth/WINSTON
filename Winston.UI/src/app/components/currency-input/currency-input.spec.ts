import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyInput } from './currency-input';

describe('CurrencyInput', () => {
  let component: CurrencyInput;
  let fixture: ComponentFixture<CurrencyInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyInput],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates its numeric value while typing', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '12.34';

    input.dispatchEvent(new Event('input'));

    expect(component.value()).toBe(12.34);
  });

  it('uses zero for non-numeric input', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'not money';

    input.dispatchEvent(new Event('input'));

    expect(component.value()).toBe(0);
  });

  it('clamps negative values to zero on blur', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '-5';

    input.dispatchEvent(new Event('blur'));

    expect(component.value()).toBe(0);
    expect(input.value).toBe('');
  });

  it('formats positive values to two decimals on blur', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '5.5';

    input.dispatchEvent(new Event('blur'));

    expect(component.value()).toBe(5.5);
    expect(input.value).toBe('5.50');
  });
});
