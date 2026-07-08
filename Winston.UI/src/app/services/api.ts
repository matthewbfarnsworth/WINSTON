import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { User, Trip, Transaction } from '../models';

@Service()
export class ApiService {
    private http = inject(HttpClient);
    //TODO replace when deploying to azure
    private apiUrl = 'http://localhost:5211/api';
    //TODO remove mock auth
    public currentUserId = '00000000-0000-0000-0000-000000000001';

    //TODO remove mock auth
    public login(userId: string) {
        this.currentUserId = userId;
        localStorage.setItem('winston_user_id', userId);
    }

    //TODO remove mock auth
    public logout() {
        this.currentUserId = '';
        localStorage.removeItem('winston_user_id');
    }

    private getOptions() {
        return {
            headers: {
                'X-User-Id': this.currentUserId
            }
        }
    };

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`, this.getOptions());
    }

    getCurrentUser(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/users/me`, this.getOptions());
    }

    createUser(user: User): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/users`, user, this.getOptions());
    }

    getTrips(): Observable<Trip[]> {
        return this.http.get<Trip[]>(`${this.apiUrl}/trips`, this.getOptions());
    }

    getTrip(id: string): Observable<Trip> {
        return this.http.get<Trip>(`${this.apiUrl}/trips/${id}`, this.getOptions());
    }

    createTrip(trip: Trip): Observable<Trip> {
        return this.http.post<Trip>(`${this.apiUrl}/trips`, trip, this.getOptions());
    }

    updateTrip(id: string, trip: Trip): Observable<Trip> {
        return this.http.put<Trip>(`${this.apiUrl}/trips/${id}`, trip, this.getOptions());
    }

    deleteTrip(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/trips/${id}`, this.getOptions());
    }

    uploadReceipt(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(`${this.apiUrl}/trips/upload`, formData, this.getOptions());
    }

    getTransactions(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, this.getOptions());
    }

    createTransaction(transaction: Transaction): Observable<Transaction> {
        return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction, this.getOptions());
    }

    updateTransaction(id: string, transaction: Transaction): Observable<Transaction> {
        return this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}`, transaction, this.getOptions());
    }

    toggleTransactionReceived(id: string): Observable<Transaction> {
        return this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}/toggle-received`, {}, this.getOptions());
    }
}