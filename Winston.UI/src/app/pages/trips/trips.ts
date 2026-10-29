import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api';
import { Trip } from '../../models';
import { Avatar } from '../../components/avatar/avatar';
import { LoadingState } from '../../components/loading-state/loading-state';
import { ListRow } from '../../components/list-row/list-row';
import { LinkButton } from '../../components/link-button/link-button';
import { SmallButton } from '../../components/small-button/small-button';
import { ReceiptImage } from '../../components/receipt-image/receipt-image';

@Component({
  selector: 'app-trips',
  imports: [Avatar, LoadingState, ListRow, LinkButton, ReceiptImage, CurrencyPipe],
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

  protected isOwner(ownerId: string): boolean {
    return ownerId === this.apiService.currentUserId;
  }
}
