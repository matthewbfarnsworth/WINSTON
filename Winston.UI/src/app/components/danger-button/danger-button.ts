import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-danger-button',
  imports: [],
  templateUrl: './danger-button.html',
  styleUrl: './danger-button.css',
})
export class DangerButton {
  disabled = input<boolean>(false);
  buttonClick = output<void>();

  protected onClick() {
    if (!this.disabled()) {
      this.buttonClick.emit();
    }
  }
}
