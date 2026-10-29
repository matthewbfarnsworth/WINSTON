import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { Observable, of, throwError } from 'rxjs';
import { ApiService } from '../services/api';
import { User } from '../models';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const account = { homeAccountId: 'account' } as AccountInfo;
  let activeAccount: AccountInfo | null;
  let currentUserResponse: Observable<User>;
  let instance: {
    initialize: ReturnType<typeof vi.fn>;
    handleRedirectPromise: ReturnType<typeof vi.fn>;
    getActiveAccount: ReturnType<typeof vi.fn>;
    getAllAccounts: ReturnType<typeof vi.fn>;
    setActiveAccount: ReturnType<typeof vi.fn>;
    loginRedirect: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    activeAccount = account;
    currentUserResponse = of({ id: 'alice', name: 'Alice' });
    instance = {
      initialize: vi.fn().mockResolvedValue(undefined),
      handleRedirectPromise: vi.fn().mockResolvedValue(null),
      getActiveAccount: vi.fn(() => activeAccount),
      getAllAccounts: vi.fn(() => activeAccount ? [activeAccount] : []),
      setActiveAccount: vi.fn(),
      loginRedirect: vi.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MsalService, useValue: { instance } },
        {
          provide: ApiService,
          useValue: { getCurrentUser: () => currentUserResponse }
        }
      ]
    });
  });

  it('allows an authenticated and allowed account', async () => {
    const result = await executeGuard();

    expect(result).toBe(true);
    expect(instance.initialize).toHaveBeenCalledOnce();
  });

  it('starts login when no account is available', async () => {
    activeAccount = null;

    const result = await executeGuard();

    expect(result).toBe(false);
    expect(instance.loginRedirect).toHaveBeenCalledOnce();
  });

  it('redirects authenticated users outside the allow-list', async () => {
    currentUserResponse = throwError(() => new HttpErrorResponse({ status: 403 }));

    const result = await executeGuard();
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/access-denied');
  });

  async function executeGuard() {
    return TestBed.runInInjectionContext(() => authGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot
    ));
  }
});
