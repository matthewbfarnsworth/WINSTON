import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { Trip, TripUser, User } from '../../models';

@Component({
  selector: 'app-edit-trip',
  imports: [FormsModule, RouterLink],
  templateUrl: './edit-trip.html',
  styleUrl: './edit-trip.css',
})
export class EditTrip {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected isEditMode = signal(false);
  protected tripId = signal<string | null>(null);
  protected allUsers = signal<User[]>([]);
  protected isLoading = signal(true);
  protected isUploading = signal(false);
  protected name = signal('New Trip');
  protected date = signal(new Date().toISOString().substring(0, 10));
  protected total = signal(0.00);
  protected notes = signal('');
  protected receiptImageUrl = signal('');
  protected tripUsers = signal<TripUser[]>([]);
  protected canAddMoreUsers = computed(() => {
    return this.tripUsers().length < this.allUsers().length;
  });
  protected isFormValid = computed(() => {
    const validName = this.name().trim().length > 0;
    const validDate = !!this.date();
    const validTotal = this.total() > 0;
    const hasUsers = this.tripUsers().length > 0;
    return validName && validDate && validTotal && hasUsers;
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
        this.tripId.set(id);
        this.loadTrip(id);
      } else {
        const currentUserId = this.apiService.currentUserId;
        this.tripUsers.set([
          { userId: currentUserId, personalCost: 0.00 }
        ]);
        this.isLoading.set(false);
      }
    });
  }

  private loadTrip(id: string) {
    this.apiService.getTrip(id).subscribe({
      next: (trip) => {
        if (trip.ownerId !== this.apiService.currentUserId) {
          this.router.navigate(['/trips']);
          return;
        }
        this.name.set(trip.name);
        this.date.set(trip.date ? trip.date.substring(0, 10) : new Date().toISOString().substring(0, 10));
        this.total.set(trip.total);
        this.notes.set(trip.notes || '');
        this.receiptImageUrl.set(trip.receiptImageUrl || '');
        this.tripUsers.set(trip.tripUsers || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load trip', err);
        this.isLoading.set(false);
      }
    });
  }

  protected updateTotal(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const num = parseFloat(val);
    this.total.set(isNaN(num) ? 0 : num);
  }

  protected formatTotalOnBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    const cost = Math.max(0, parseFloat(input.value) || 0);
    this.total.set(cost);
    input.value = cost > 0 ? cost.toFixed(2) : '';
  }

  protected addUser() {
    if (!this.canAddMoreUsers()) return;
    const availableUser = this.allUsers().find(user =>
      !this.tripUsers().some(tripUser => tripUser.userId === user.id)
    );
    if (!availableUser || !availableUser.id) return;
    this.tripUsers.update(list => [
      ...list,
      { userId: availableUser.id!, personalCost: 0 }
    ]);
  }

  protected getAvailableUsersForDropdown(currentSelectedUserId: string): User[] {
    return this.allUsers().filter(user => 
      user.id === currentSelectedUserId || !this.tripUsers().some(tripUser => tripUser.userId === user.id)
    );
  }

  protected removeUser(index: number) {
    const ownerId = this.apiService.currentUserId;
    if (this.tripUsers()[index].userId === ownerId) return;
    this.tripUsers.update(list => list.filter((_, i) => i !== index));
  }

  protected updateUserId(index: number, newUserId: string) {
    this.tripUsers.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], userId: newUserId };
      return updated;
    });
  }

  protected updatePersonalCost(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const num = parseFloat(val);
    const cost = isNaN(num) ? 0 : num;
    this.tripUsers.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], personalCost: cost };
      return updated;
    })
  }

  protected formatPersonalCostOnBlur(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const cost = Math.max(0, parseFloat(input.value) || 0);
    this.tripUsers.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], personalCost: cost };
      return updated;
    });
    input.value = cost > 0 ? cost.toFixed(2) : '';
  }

  protected onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploading.set(true);
    this.apiService.uploadReceipt(file).subscribe({
      next: (resolution) => {
        this.receiptImageUrl.set(resolution.url);
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Failed to upload receipt', err);
        this.isUploading.set(false);
      }
    });
  }

  protected getSummarySplits(): { userName: string; owesAmount: number }[] {
    const currentUserId = this.apiService.currentUserId;
    const usersList = this.tripUsers();
    const count = usersList.length;
    if (count === 0) return [];
    const sumPersonal = usersList.reduce((sum, tripUser) => sum + (tripUser.personalCost || 0), 0);
    const sharedTotal = this.total() - sumPersonal;
    const baseShare = Math.floor((sharedTotal / count) * 100) / 100;

    return usersList
      .filter(tripUser => tripUser.userId !== currentUserId)
      .map(tripUser => {
        const userObj = this.allUsers().find(user => user.id === tripUser.userId);
        const share = baseShare + (tripUser.personalCost || 0);
        return {
          userName: userObj?.name || 'User',
          owesAmount: Math.max(0, share)
        };
      });
  }

  protected isOwner(userId: string): boolean {
    return userId === this.apiService.currentUserId;
  }

  protected saveTrip() {
    const tripData: Trip = {
      id: this.tripId() || undefined,
      ownerId: this.apiService.currentUserId,
      name: this.name(),
      date: this.date(),
      total: this.total(),
      notes: this.notes() || null,
      receiptImageUrl: this.receiptImageUrl() || null,
      tripUsers: this.tripUsers().map(tripUser => ({
        userId: tripUser.userId,
        personalCost: tripUser.personalCost || 0
      }))
    };

    if (this.isEditMode() && this.tripId()) {
      this.apiService.updateTrip(this.tripId()!, tripData).subscribe(() => {
        this.router.navigate(['/trips']);
      });
    } else {
      this.apiService.createTrip(tripData).subscribe(() => {
        this.router.navigate(['/trips']);
      });
    }
  }
}
