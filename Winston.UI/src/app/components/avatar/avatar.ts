import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar {
  name = input<string | undefined>('');
  avatarUrl = input<string | null | undefined>('');
  size = input<'small' | 'large'>('small');
  protected hasImageError = signal(false);
  protected initials = computed(() => {
    const text = this.name()?.trim() || '';
    if (!text) return '?';
    const parts = text.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  });
}