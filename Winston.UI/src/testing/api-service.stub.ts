import { signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AccessRequestInfo, Transaction, Trip, User } from '../app/models';

export class ApiServiceStub {
  readonly alice: User = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Alice'
  };
  readonly bob: User = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Bob'
  };

  currentUser = signal<User | null>(this.alice);
  users: User[] = [this.alice, this.bob];
  trips: Trip[] = [];
  transactions: Transaction[] = [];
  balances: { [userId: string]: number } = {};

  get currentUserId(): string {
    return this.currentUser()?.id ?? '';
  }

  getCurrentUser(): Observable<User> {
    return of(this.currentUser()!);
  }

  getUsers(): Observable<User[]> {
    return of(this.users);
  }

  getAccessRequestInfo(): Observable<AccessRequestInfo> {
    return of({
      requestEmail: 'owner@example.com',
      objectId: this.currentUserId
    });
  }

  getBalances(): Observable<{ [userId: string]: number }> {
    return of(this.balances);
  }

  getTrips(): Observable<Trip[]> {
    return of(this.trips);
  }

  getTrip(id: string): Observable<Trip> {
    return of(this.trips.find(trip => trip.id === id)!);
  }

  createTrip(trip: Trip): Observable<Trip> {
    return of(trip);
  }

  updateTrip(_id: string, trip: Trip): Observable<Trip> {
    return of(trip);
  }

  deleteTrip(_id: string): Observable<void> {
    return of(undefined);
  }

  uploadReceipt(_file: File): Observable<{ blobName: string }> {
    return of({ blobName: 'receipt.png' });
  }

  getReceipt(_tripId: string): Observable<Blob> {
    return of(new Blob());
  }

  getTransactions(): Observable<Transaction[]> {
    return of(this.transactions);
  }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    return of(transaction);
  }

  updateTransaction(_id: string, transaction: Transaction): Observable<Transaction> {
    return of(transaction);
  }

  toggleTransactionReceived(id: string): Observable<Transaction> {
    return of(this.transactions.find(transaction => transaction.id === id)!);
  }
}
