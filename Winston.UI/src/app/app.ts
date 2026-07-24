import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, CanActivateFn } from '@angular/router';
import { ApiService } from './services/api';

export const authGuard: CanActivateFn = () => {
  const apiService = inject(ApiService);
  const router = inject(Router);
  if (apiService.currentUserId) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

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

  constructor() {}
}
