import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { Trip, TripUser, User } from '../../models';
import { CurrencyInput } from '../../components/currency-input/currency-input';
import { DateInput } from '../../components/date-input/date-input';
import { UserSelect } from '../../components/user-select/user-select';
import { NotesInput } from '../../components/notes-input/notes-input';
import { FileUpload } from '../../components/file-upload/file-upload';
import { LoadingState } from '../../components/loading-state/loading-state';
import { PrimaryButton } from '../../components/primary-button/primary-button';
import { SmallButton } from '../../components/small-button/small-button';
import { LinkButton } from '../../components/link-button/link-button';
import { DangerButton } from '../../components/danger-button/danger-button';
import { ReceiptImage } from '../../components/receipt-image/receipt-image';

@Component({
  selector: 'app-edit-trip',
  imports: [
    FormsModule,
    CurrencyPipe,
    CurrencyInput,
    DateInput,
    UserSelect,
    NotesInput,
    FileUpload,
    LoadingState,
    PrimaryButton,
    SmallButton,
    LinkButton,
    DangerButton,
    ReceiptImage
  ],
  templateUrl: './edit-trip.html',
  styleUrl: './edit-trip.css',
})
export class EditTrip implements OnDestroy {
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
  protected receiptPreviewUrl = signal('');
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

  protected updatePersonalCost(index: number, cost: number) {
    this.tripUsers.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], personalCost: cost };
      return updated;
    });
  }

  protected onFileSelected(file: File) {
    this.clearReceiptPreview();
    this.receiptPreviewUrl.set(URL.createObjectURL(file));
    this.isUploading.set(true);
    this.apiService.uploadReceipt(file).subscribe({
      next: (resolution) => {
        this.receiptImageUrl.set(resolution.blobName);
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Failed to upload receipt', err);
        this.clearReceiptPreview();
        this.isUploading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.clearReceiptPreview();
  }

  private clearReceiptPreview() {
    const objectUrl = this.receiptPreviewUrl();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    this.receiptPreviewUrl.set('');
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

