import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api';
import { ApiServiceStub } from '../../../testing/api-service.stub';
import { Trip } from '../../models';
import { Trips } from './trips';

describe('Trips', () => {
  let fixture: ComponentFixture<Trips>;
  let api: ApiServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trips],
      providers: [
        provideRouter([]),
        { provide: ApiService, useClass: ApiServiceStub }
      ]
    }).compileComponents();

    api = TestBed.inject(ApiService) as unknown as ApiServiceStub;
  });

  it('renders loaded trips and an edit link for the owner', async () => {
    api.trips = [createTrip(api.alice.id!)];
    fixture = TestBed.createComponent(Trips);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Cabin Weekend');
    expect(fixture.nativeElement.textContent).toContain('Edit Trip');
  });

  it('expands a trip to show participant splits', async () => {
    api.trips = [createTrip(api.alice.id!)];
    fixture = TestBed.createComponent(Trips);
    await fixture.whenStable();
    const tripButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    tripButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bob: $25.00');
  });

  it('hides the edit link when the current user is not the owner', async () => {
    api.trips = [createTrip(api.bob.id!)];
    fixture = TestBed.createComponent(Trips);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Edit Trip');
  });

  function createTrip(ownerId: string): Trip {
    return {
      id: 'trip-1',
      ownerId,
      owner: ownerId === api.alice.id ? api.alice : api.bob,
      name: 'Cabin Weekend',
      date: '2026-10-29',
      total: 50,
      tripUsers: [
        { userId: api.alice.id!, user: api.alice, personalCost: 0, split: 25 },
        { userId: api.bob.id!, user: api.bob, personalCost: 0, split: 25 }
      ]
    };
  }
});
