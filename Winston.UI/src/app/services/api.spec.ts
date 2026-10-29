import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Trip, User } from '../models';
import { ApiService } from './api';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads all users', () => {
    const expected: User[] = [{ id: 'alice', name: 'Alice' }];
    let actual: User[] | undefined;

    service.getUsers().subscribe(users => actual = users);
    http.expectOne(request => request.url.endsWith('/users')).flush(expected);

    expect(actual).toEqual(expected);
  });

  it('loads and caches the current user', () => {
    const expected: User = { id: 'alice', name: 'Alice' };
    let first: User | undefined;
    let second: User | undefined;

    service.getCurrentUser().subscribe(user => first = user);
    http.expectOne(request => request.url.endsWith('/users/me')).flush(expected);
    service.getCurrentUser().subscribe(user => second = user);

    expect(first).toEqual(expected);
    expect(second).toEqual(expected);
    expect(service.currentUserId).toBe('alice');
    http.expectNone(request => request.url.endsWith('/users/me'));
  });

  it('loads balances', () => {
    let actual: { [userId: string]: number } | undefined;

    service.getBalances().subscribe(balances => actual = balances);
    http.expectOne(request => request.url.endsWith('/users/balances')).flush({ bob: 12.5 });

    expect(actual).toEqual({ bob: 12.5 });
  });

  it('creates a trip with POST', () => {
    const trip = createTrip();

    service.createTrip(trip).subscribe();
    const request = http.expectOne(request => request.url.endsWith('/trips'));

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(trip);
    request.flush(trip);
  });

  it('updates a trip with PUT', () => {
    const trip = createTrip();

    service.updateTrip('trip-1', trip).subscribe();
    const request = http.expectOne(request => request.url.endsWith('/trips/trip-1'));

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(trip);
    request.flush(trip);
  });

  it('requests receipt content as a blob', () => {
    service.getReceipt('trip-1').subscribe();
    const request = http.expectOne(request => request.url.endsWith('/trips/trip-1/receipt'));

    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['receipt'], { type: 'image/png' }));
  });

  it('uploads receipt files as form data', () => {
    const file = new File(['receipt'], 'receipt.png', { type: 'image/png' });

    service.uploadReceipt(file).subscribe();
    const request = http.expectOne(request => request.url.endsWith('/trips/upload'));

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    expect((request.request.body as FormData).get('file')).toBe(file);
    request.flush({ blobName: 'receipt.png' });
  });

  it('toggles transaction receipt status with PUT', () => {
    service.toggleTransactionReceived('transaction-1').subscribe();
    const request = http.expectOne(request =>
      request.url.endsWith('/transactions/transaction-1/toggle-received'));

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({});
    request.flush({});
  });

  function createTrip(): Trip {
    return {
      id: 'trip-1',
      ownerId: 'alice',
      name: 'Dinner',
      date: '2026-10-29',
      total: 20,
      tripUsers: [{ userId: 'alice', personalCost: 0 }]
    };
  }
});
