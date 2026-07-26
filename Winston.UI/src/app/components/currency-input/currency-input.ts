import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-currency-input',
  imports: [],
  templateUrl: './currency-input.html',
  styleUrl: './currency-input.css',
})
export class CurrencyInput {
  value = model<number>(0);
  placeholder = input<string>('0.00');
  compact = input<boolean>(false);

  protected onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const num = parseFloat(val);
    this.value.set(isNaN(num) ? 0 : num);
  }

  protected onBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    const cost = Math.max(0, parseFloat(input.value) || 0);
    this.value.set(cost);
    input.value = cost > 0 ? cost.toFixed(2) : '';
  }
}
