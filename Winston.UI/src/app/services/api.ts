import { HttpClient } from "@angular/common/http";
import { inject, Service, signal } from "@angular/core";
import { Observable, of, shareReplay, tap } from "rxjs";
import { User, Trip, Transaction } from "../models";
import { environment } from "../../environments/environment";

@Service()
export class ApiService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;
    private currentUserRequest?: Observable<User>;
    public currentUser = signal<User | null>(null);
    public get currentUserId(): string {
        return this.currentUser()?.id || '';
    }

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`);
    }

    getCurrentUser(): Observable<User> {
        const currentUser = this.currentUser();
        if (currentUser) return of(currentUser);

        this.currentUserRequest ??= this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
            tap(user => this.currentUser.set(user)),
            shareReplay({ bufferSize: 1, refCount: false })
        );
        return this.currentUserRequest;
    }

    getBalances(): Observable<{ [userId: string]: number }> {
        return this.http.get<{ [userId: string]: number }>(`${this.apiUrl}/users/balances`);
    }

    getTrips(): Observable<Trip[]> {
        return this.http.get<Trip[]>(`${this.apiUrl}/trips`);
    }

    getTrip(id: string): Observable<Trip> {
        return this.http.get<Trip>(`${this.apiUrl}/trips/${id}`);
    }

    createTrip(trip: Trip): Observable<Trip> {
        return this.http.post<Trip>(`${this.apiUrl}/trips`, trip);
    }

    updateTrip(id: string, trip: Trip): Observable<Trip> {
        return this.http.put<Trip>(`${this.apiUrl}/trips/${id}`, trip);
    }

    deleteTrip(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/trips/${id}`);
    }

    uploadReceipt(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(`${this.apiUrl}/trips/upload`, formData);
    }

    getTransactions(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`);
    }

    createTransaction(transaction: Transaction): Observable<Transaction> {
        return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction);
    }

    updateTransaction(id: string, transaction: Transaction): Observable<Transaction> {
        return this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}`, transaction);
    }

    toggleTransactionReceived(id: string): Observable<Transaction> {
        return this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}/toggle-received`, {});
    }
}
