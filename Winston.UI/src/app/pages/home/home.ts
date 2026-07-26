import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api';
import { User } from '../../models';
import { Avatar } from '../../components/avatar/avatar';
import { LoadingState } from '../../components/loading-state/loading-state';
import { ListRow } from '../../components/list-row/list-row';

export interface UserBalanceView {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  amount: number;
  userOwesMe: boolean;
}

@Component({
  selector: 'app-home',
  imports: [Avatar, LoadingState, ListRow, CurrencyPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private apiService = inject(ApiService);
  protected currentUser = signal<User | null>(null);
  protected users = signal<User[]>([]);
  protected balances = signal<{ [userId: string]: number }>({});
  protected isLoading = signal(true);
  protected displayBalances = computed<UserBalanceView[]>(() => {
    const current = this.currentUser();
    const allUsers = this.users();
    const balanceMap = this.balances();
    if (!current) return [];
    return allUsers
      .filter(user => user.id && user.id !== current.id)
      .map(user => {
        const rawBalance = balanceMap[user.id!] || 0;
        return {
          userId: user.id!,
          name: user.name,
          avatarUrl: user.avatarUrl,
          amount: Math.abs(rawBalance),
          userOwesMe: rawBalance > 0,
          hasBalance: Math.abs(rawBalance) >= 0.01
        };
      })
        .filter(item => item.hasBalance);
  });


  constructor() {
    this.loadData();
  }

  private loadData() {
    this.apiService.getCurrentUser().subscribe(user => this.currentUser.set(user));
    this.apiService.getUsers().subscribe(users => this.users.set(users));
    this.apiService.getBalances().subscribe(balances => {
      this.balances.set(balances);
      this.isLoading.set(false);
    })
  }
}
