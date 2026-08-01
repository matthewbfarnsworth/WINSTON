import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { EventType, provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EventMessage, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalBroadcastService, MsalGuard, MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalService } from '@azure/msal-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.entra.clientId,
      authority: `https://login.microsoftonline.com/${environment.entra.tenantId}`,
      redirectUri: environment.entra.redirectUri
    },
    cache: {
      cacheLocation: 'localStorage'
    }
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          [`${environment.apiUrl}/*`, [`api://${environment.entra.clientId}/access_as_user`]]
        ])
      } as MsalInterceptorConfiguration
    },
    MsalService,
    MsalBroadcastService
  ]
};
