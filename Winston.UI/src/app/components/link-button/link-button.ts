import { Component, computed, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

@Component({
  selector: 'app-link-button',
  imports: [RouterLink],
  templateUrl: './link-button.html',
  styleUrl: './link-button.css',
})
export class LinkButton {
  routerLink = input<string | any[] | null>(null);
  queryParams = input<Params | null>(null);
  variant = input<'cyan' | 'muted'>('cyan');

  protected buttonClass = computed(() => {
    if (this.variant() === 'muted') {
      return 'text-xs text-slate-500 hover:text-slate-800 cursor-pointer transition-colors duration-150 ease-in-out';
    }
    return 'text-sm font-semibold text-cyan-600 hover:underline cursor-pointer transition-colors duration-150 ease-in-out';
  });
}