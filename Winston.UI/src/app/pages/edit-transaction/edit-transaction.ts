import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { Transaction, User } from '../../models';
import { CurrencyInput } from '../../components/currency-input/currency-input';
import { DateInput } from '../../components/date-input/date-input';
import { UserSelect } from '../../components/user-select/user-select';
import { NotesInput } from '../../components/notes-input/notes-input';
import { LoadingState } from '../../components/loading-state/loading-state';
import { PrimaryButton } from '../../components/primary-button/primary-button';
import { LinkButton } from '../../components/link-button/link-button';

@Component({
  selector: 'app-edit-transaction',
  imports: [
    FormsModule,
    CurrencyInput,
    DateInput,
    UserSelect,
    NotesInput,
    LoadingState,
    PrimaryButton,
    LinkButton
  ],
  templateUrl: './edit-transaction.html',
  styleUrl: './edit-transaction.css',
})
export class EditTransaction {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected isEditMode = signal(false);
  protected transactionId = signal<string | null>(null);
  protected allUsers = signal<User[]>([]);
  protected isLoading = signal(true);
  protected date = signal(new Date().toISOString().substring(0, 10));
  protected recipientId = signal('');
  protected cost = signal(0.00);
  protected notes = signal('');
  protected recipientDidNotReceive = signal(false);
  protected availableRecipients = computed(() => {
    const currentUserId = this.apiService.currentUserId;
    return this.allUsers().filter(user => user.id !== currentUserId);
  });
  protected isFormValid = computed(() => {
    const validDate = !!this.date();
    const validRecipient = !!this.recipientId();
    const validCost = this.cost() > 0;
    return validDate && validRecipient && validCost;
  });

  constructor() {
    this.initForm();
  }

  private initForm() {
    this.apiService.getUsers().subscribe(users => {
      this.allUsers.set(users);
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.transactionId.set(id);
        this.loadTransaction(id);
      } else {
        const recipients = this.availableRecipients();
        if (recipients.length > 0 && recipients[0].id) {
          this.recipientId.set(recipients[0].id);
        }
        this.isLoading.set(false);
      }
    });
  }

  private loadTransaction(id: string) {
    this.apiService.getTransactions().subscribe({
      next: (transactions) => {
        const transaction = transactions.find(transaction => transaction.id === id);
        if (!transaction) {
          this.router.navigate(['/transactions']);
          return;
        }
        if (transaction.senderId !== this.apiService.currentUserId) {
          this.router.navigate(['/transactions']);
          return;
        }
        this.date.set(transaction.date ? transaction.date.substring(0, 10) : new Date().toISOString().substring(0, 10));
        this.recipientId.set(transaction.recipientId);
        this.cost.set(transaction.cost);
        this.notes.set(transaction.notes || '');
        this.recipientDidNotReceive.set(transaction.recipientDidNotReceive || false);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load transaction', err);
        this.isLoading.set(false);
      }
    });
  }

  protected saveTransaction() {
    const transactionData: Transaction = {
      id: this.transactionId() || undefined,
      senderId: this.apiService.currentUserId,
      recipientId: this.recipientId(),
      date: this.date(),
      cost: this.cost(),
      recipientDidNotReceive: this.recipientDidNotReceive(),
      notes: this.notes() || null,
    };
    if (this.isEditMode() && this.transactionId()) {
      this.apiService.updateTransaction(this.transactionId()!, transactionData).subscribe(() => {
        this.router.navigate(['/transactions']);
      });
    } else {
      this.apiService.createTransaction(transactionData).subscribe(() => {
        this.router.navigate(['/transactions']);
      })
    }
  }
}

