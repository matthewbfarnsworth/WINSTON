import { Component, inject } from '@angular/core';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private apiService = inject(ApiService);
  private router = inject(Router);

  protected onLogout() {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }
}