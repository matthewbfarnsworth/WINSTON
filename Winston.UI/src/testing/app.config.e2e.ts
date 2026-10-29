import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { routes } from '../app/app.routes';

const account = {
  homeAccountId: 'e2e-account',
  environment: 'login.microsoftonline.com',
  tenantId: 'consumers',
  username: 'alice@example.com',
  localAccountId: '11111111-1111-1111-1111-111111111111',
  name: 'Alice'
} as AccountInfo;

class E2eMsalService {
  readonly instance = {
    initialize: async () => undefined,
    handleRedirectPromise: async () => null,
    getActiveAccount: () => account,
    getAllAccounts: () => [account],
    setActiveAccount: () => undefined,
    loginRedirect: async () => undefined,
    logoutRedirect: async () => undefined
  } as unknown as IPublicClientApplication;

  logoutRedirect(): Promise<void> {
    return Promise.resolve();
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: MsalService, useClass: E2eMsalService }
  ]
};
