import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  imports: [],
  templateUrl: './primary-button.html',
  styleUrl: './primary-button.css',
})
export class PrimaryButton {
  type = input<'button' | 'submit'>('button');
  disabled = input<boolean>(false);
  buttonClick = output<void>();

  protected onClick() {
    if (!this.disabled()) {
      this.buttonClick.emit();
    }
  }
}
