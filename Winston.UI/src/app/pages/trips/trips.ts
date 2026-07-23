import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { Trip } from '../../models';

@Component({
  selector: 'app-trips',
  imports: [RouterLink],
  templateUrl: './trips.html',
  styleUrl: './trips.css',
})
export class Trips {
  private apiService = inject(ApiService);
  protected trips = signal<Trip[]>([]);
  protected isLoading = signal(true);
  protected expandedTripId = signal<string | null>(null);

  constructor() {
    this.loadTrips();
  }

  private loadTrips() {
    this.apiService.getTrips().subscribe({
      next: (data) => {
        this.trips.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load trips', err);
        this.isLoading.set(false);
      }
    });
  }

  protected toggleAccordion(tripId: string) {
    if (this.expandedTripId() === tripId) {
      this.expandedTripId.set(null);
    } else {
      this.expandedTripId.set(tripId);
    }
  }

  protected formatMoney(amount: number | undefined): string {
    return (amount || 0).toFixed(2);
  }

  protected isOwner(ownerId: string): boolean {
    return ownerId === this.apiService.currentUserId;
  }
}