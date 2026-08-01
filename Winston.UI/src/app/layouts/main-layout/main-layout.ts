import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Avatar } from '../../components/avatar/avatar';
import { ApiService } from '../../services/api';
import { User } from '../../models';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avatar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private apiService = inject(ApiService);
  protected currentUser = signal<User | null>(null);

  constructor() {
    this.apiService.getCurrentUser().subscribe(user => this.currentUser.set(user));
  }
}