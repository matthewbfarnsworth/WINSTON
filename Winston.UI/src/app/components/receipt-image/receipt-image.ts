import { Component, effect, inject, input, signal } from '@angular/core';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-receipt-image',
  imports: [],
  templateUrl: './receipt-image.html',
})
export class ReceiptImage {
  private apiService = inject(ApiService);
  tripId = input.required<string>();
  alt = input('Receipt');
  protected imageUrl = signal('');
  protected loadFailed = signal(false);

  constructor() {
    effect(onCleanup => {
      const tripId = this.tripId();
      this.loadFailed.set(false);
      const subscription = this.apiService.getReceipt(tripId).subscribe({
        next: blob => {
          const objectUrl = URL.createObjectURL(blob);
          this.imageUrl.set(objectUrl);
        },
        error: () => this.loadFailed.set(true)
      });

      onCleanup(() => {
        subscription.unsubscribe();
        const objectUrl = this.imageUrl();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        this.imageUrl.set('');
      });
    });
  }
}
