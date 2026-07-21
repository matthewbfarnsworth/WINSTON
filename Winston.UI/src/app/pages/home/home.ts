import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api';
import { User } from '../../models';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private apiService = inject(ApiService);
  protected currentUser = signal<User | null>(null);
  protected users = signal<User[]>([]);
  protected balances = signal<{ [userId: string]: number }>({});
  protected isLoading = signal(true);

  constructor() {
    this.loadData();
  }

  private loadData() {
    this.apiService.getCurrentUser().subscribe(user => this.currentUser.set(user));
    this.apiService.getUsers().subscribe(users => {
      this.users.set(users);
      this.apiService.getBalances().subscribe(balances => {
        this.balances.set(balances);
        this.isLoading.set(false);
      });
    })
  }

  protected hasNoBalance(userId: string): boolean {
    const balance = this.balances()[userId];
    return !balance || Math.abs(balance) < 0.01;
  }

  protected getDisplayBalance(userId: string): string {
    return Math.abs(this.balances()[userId] || 0).toFixed(2);
  }

  protected userOwesMe(userId: string): boolean {
    return (this.balances()[userId] || 0) > 0;
  }
}
