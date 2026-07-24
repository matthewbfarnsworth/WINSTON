import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { Transaction } from '../../models';

@Component({
  selector: 'app-transactions',
  imports: [DatePipe, RouterLink],
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

  protected formatMoney(amount: number | undefined): string {
    return (amount || 0).toFixed(2);
  }

  protected isRecipient(recipientId: string): boolean {
    return recipientId === this.apiService.currentUserId;
  }
}
