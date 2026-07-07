import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService } from './services/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  protected currentUrl = signal('');

  constructor() {
    if (!this.apiService.currentUserId) {
      this.router.navigate(['/login']);
    }
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentUrl.set(event.urlAfterRedirects);
    })
  }
}
