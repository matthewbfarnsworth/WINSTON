import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api';
import { Transaction } from '../../models';
import { Avatar } from '../../components/avatar/avatar';
import { LoadingState } from '../../components/loading-state/loading-state';
import { ListRow } from '../../components/list-row/list-row';
import { LinkButton } from '../../components/link-button/link-button';
import { SmallButton } from '../../components/small-button/small-button';

@Component({
  selector: 'app-transactions',
  imports: [DatePipe, Avatar, LoadingState, ListRow, LinkButton, SmallButton, CurrencyPipe],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions {
  private apiService = inject(ApiService);
  protected transactions = signal<Transaction[]>([]);
  protected isLoading = signal(true);
  protected sortedTransactions = computed(() => {
    return [...this.transactions()].sort((a, b) =>
      Number(b.recipientDidNotReceive) - Number(a.recipientDidNotReceive) || b.date.localeCompare(a.date)
    )
  });

  constructor() {
    this.loadTransactions();
  }

  private loadTransactions() {
    this.apiService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load transactions', err);
        this.isLoading.set(false);
      }
    })
  }

  protected toggleReceived(transactionId: string) {
    this.apiService.toggleTransactionReceived(transactionId).subscribe({
      next: () => {
        this.loadTransactions();
      },
      error: (err) => {
        console.error('Failed to toggle transaction received', err);
      }
    })
  }

  protected isRecipient(recipientId: string): boolean {
    return recipientId === this.apiService.currentUserId;
  }
}

