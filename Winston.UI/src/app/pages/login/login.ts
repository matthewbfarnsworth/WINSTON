import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { User } from '../../models';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private apiService = inject(ApiService);
  private router = inject(Router);
  protected users = signal<User[]>([]);
  protected isLoading = signal(true);

  constructor() {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading.set(false);
      }
    });
  }

  protected onLogin(userId: string) {
    this.apiService.login(userId);
    this.router.navigate(['/home']);
  }
}
