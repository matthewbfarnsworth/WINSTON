import { Component, input, model } from '@angular/core';
import { User } from '../../models';

@Component({
  selector: 'app-user-select',
  imports: [],
  templateUrl: './user-select.html',
  styleUrl: './user-select.css',
})
export class UserSelect {
  users = input<User[]>([]);
  value = model<string>('');
  disabled = input<boolean>(false);
  compact = input<boolean>(false);

  protected onChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.value.set(select.value);
  }
}
