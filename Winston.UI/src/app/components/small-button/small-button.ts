import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-small-button',
  imports: [],
  templateUrl: './small-button.html',
  styleUrl: './small-button.css',
})
export class SmallButton {
  disabled = input<boolean>(false);
  buttonClick = output<void>();

  protected onClick() {
    if (!this.disabled()) {
      this.buttonClick.emit();
    }
  }
}
