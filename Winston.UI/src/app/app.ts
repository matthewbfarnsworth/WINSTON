import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, CanActivateFn } from '@angular/router';
import { ApiService } from './services/api';
import { User } from './models';
import { Avatar } from "./components/avatar/avatar";

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avatar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  protected currentUrl = signal('');
  protected currentUser = signal<User | null>(null);

  constructor() {
    if (this.apiService.currentUserId) {
      this.apiService.getCurrentUser().subscribe(user => this.currentUser.set(user));
    }
  }
}
