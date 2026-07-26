import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-notes-input',
  imports: [],
  templateUrl: './notes-input.html',
  styleUrl: './notes-input.css',
})
export class NotesInput {
  value = model<string>('');
  rows = input<number>(2);

  protected onInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.value.set(textarea.value);
  }
}
