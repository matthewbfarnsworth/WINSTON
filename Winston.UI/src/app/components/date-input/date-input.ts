import { Component, model } from '@angular/core';

@Component({
  selector: 'app-date-input',
  imports: [],
  templateUrl: './date-input.html',
  styleUrl: './date-input.css',
})
export class DateInput {
  value = model<string>('');

  protected onChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value);
  }
}
