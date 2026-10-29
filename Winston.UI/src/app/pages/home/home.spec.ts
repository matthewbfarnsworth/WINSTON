import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api';
import { ApiServiceStub } from '../../../testing/api-service.stub';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let api: ApiServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: ApiService, useClass: ApiServiceStub }
      ]
    }).compileComponents();

    api = TestBed.inject(ApiService) as unknown as ApiServiceStub;
  });

  it('shows positive balances as money owed to the current user', async () => {
    api.balances = { [api.bob.id!]: 12.5 };
    fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Bob owes you $12.50');
  });

  it('shows a payment link for negative balances', async () => {
    api.balances = { [api.bob.id!]: -8.25 };
    fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    const payLink = fixture.nativeElement.querySelector('a[href^="/transactions/new"]') as HTMLAnchorElement;
    expect(text).toContain('Bob is owed $8.25');
    expect(payLink).not.toBeNull();
  });

  it('does not render zero balances', async () => {
    api.balances = { [api.bob.id!]: 0 };
    fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Bob owes');
    expect(fixture.nativeElement.textContent).not.toContain('Bob is owed');
  });
});
