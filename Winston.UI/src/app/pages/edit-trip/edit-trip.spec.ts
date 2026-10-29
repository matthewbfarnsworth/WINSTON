import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api';
import { ApiServiceStub } from '../../../testing/api-service.stub';
import { EditTrip } from './edit-trip';

describe('EditTrip', () => {
  let fixture: ComponentFixture<EditTrip>;
  let api: ApiServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTrip],
      providers: [
        provideRouter([]),
        { provide: ApiService, useClass: ApiServiceStub }
      ]
    }).compileComponents();

    api = TestBed.inject(ApiService) as unknown as ApiServiceStub;
    fixture = TestBed.createComponent(EditTrip);
    await fixture.whenStable();
  });

  it('adds the authenticated user first and locks the owner selector', () => {
    const ownerSelect = fixture.nativeElement.querySelector('app-user-select select') as HTMLSelectElement;

    expect(ownerSelect.value).toBe(api.alice.id);
    expect(ownerSelect.disabled).toBe(true);
  });

  it('adds the next available user without replacing the owner', () => {
    const addButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Add User'))!;

    addButton.click();
    fixture.detectChanges();
    const selects = fixture.nativeElement.querySelectorAll('app-user-select select') as NodeListOf<HTMLSelectElement>;

    expect(selects.length).toBe(2);
    expect(selects[0].value).toBe(api.alice.id);
    expect(selects[1].value).toBe(api.bob.id);
  });

  it('blocks saving when personal costs exceed the trip total', () => {
    const currencyInputs = fixture.nativeElement.querySelectorAll(
      'app-currency-input input'
    ) as NodeListOf<HTMLInputElement>;
    currencyInputs[0].value = '10';
    currencyInputs[0].dispatchEvent(new Event('input'));
    currencyInputs[1].value = '11';
    currencyInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('app-primary-button button') as HTMLButtonElement;
    expect(fixture.nativeElement.textContent).toContain('cannot exceed the trip total');
    expect(saveButton.disabled).toBe(true);
  });
});
