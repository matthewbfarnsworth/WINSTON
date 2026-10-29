import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { ApiServiceStub } from '../../../testing/api-service.stub';
import { EditTransaction } from './edit-transaction';

describe('EditTransaction', () => {
  let fixture: ComponentFixture<EditTransaction>;
  let api: ApiServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTransaction],
      providers: [
        provideRouter([]),
        { provide: ApiService, useClass: ApiServiceStub }
      ]
    }).compileComponents();

    api = TestBed.inject(ApiService) as unknown as ApiServiceStub;
    fixture = TestBed.createComponent(EditTransaction);
    await fixture.whenStable();
  });

  it('defaults the recipient to the first user other than the current user', () => {
    const options = fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>;
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain('Bob');
    expect(select.value).toBe(api.bob.id);
  });

  it('keeps save disabled until a positive cost is entered', () => {
    const saveButton = fixture.nativeElement.querySelector('app-primary-button button') as HTMLButtonElement;

    expect(saveButton.disabled).toBe(true);

    const costInput = fixture.nativeElement.querySelector('app-currency-input input') as HTMLInputElement;
    costInput.value = '15.25';
    costInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(saveButton.disabled).toBe(false);
  });

  it('creates a transaction from the completed form', () => {
    const create = vi.spyOn(api, 'createTransaction');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const costInput = fixture.nativeElement.querySelector('app-currency-input input') as HTMLInputElement;
    costInput.value = '15.25';
    costInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector('app-primary-button button') as HTMLButtonElement;

    saveButton.click();

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      senderId: api.alice.id,
      recipientId: api.bob.id,
      cost: 15.25
    }));
  });
});
