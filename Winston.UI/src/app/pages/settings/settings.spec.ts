import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsalService } from '@azure/msal-angular';
import { Settings } from './settings';

describe('Settings', () => {
  let fixture: ComponentFixture<Settings>;
  let logoutRedirect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    logoutRedirect = vi.fn();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: MsalService, useValue: { logoutRedirect } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
  });

  it('renders a logout action', () => {
    expect(fixture.nativeElement.textContent).toContain('Logout');
  });

  it('starts an Entra logout redirect', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();

    expect(logoutRedirect).toHaveBeenCalledOnce();
  });
});
