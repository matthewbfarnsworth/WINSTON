import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api';
import { ApiServiceStub } from '../../../testing/api-service.stub';
import { Transaction } from '../../models';
import { Transactions } from './transactions';

describe('Transactions', () => {
  let fixture: ComponentFixture<Transactions>;
  let api: ApiServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [
        provideRouter([]),
        { provide: ApiService, useClass: ApiServiceStub }
      ]
    }).compileComponents();

    api = TestBed.inject(ApiService) as unknown as ApiServiceStub;
  });

  it('sorts disputed transactions before newer completed transactions', async () => {
    api.transactions = [
      createTransaction('newer', '2026-10-29', false),
      createTransaction('disputed', '2026-01-01', true)
    ];
    fixture = TestBed.createComponent(Transactions);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('app-list-row') as NodeListOf<HTMLElement>;
    expect(rows[0].textContent).toContain('Not Received!');
    expect(rows[1].textContent).not.toContain('Not Received!');
  });

  it('shows receipt controls to the recipient', async () => {
    api.transactions = [createTransaction('transaction-1', '2026-10-29', false)];
    fixture = TestBed.createComponent(Transactions);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Did Not Receive?');
  });

  it('reloads transactions after toggling receipt status', async () => {
    api.transactions = [createTransaction('transaction-1', '2026-10-29', false)];
    const toggle = vi.spyOn(api, 'toggleTransactionReceived');
    const reload = vi.spyOn(api, 'getTransactions');
    fixture = TestBed.createComponent(Transactions);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('app-small-button button') as HTMLButtonElement;

    button.click();

    expect(toggle).toHaveBeenCalledWith('transaction-1');
    expect(reload).toHaveBeenCalledTimes(2);
  });

  function createTransaction(id: string, date: string, disputed: boolean): Transaction {
    return {
      id,
      senderId: api.bob.id!,
      sender: api.bob,
      recipientId: api.alice.id!,
      recipient: api.alice,
      date,
      cost: 20,
      recipientDidNotReceive: disputed
    };
  }
});
