import { inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { CanActivateFn, Router } from "@angular/router";
import { MsalService } from "@azure/msal-angular";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { ApiService } from "../services/api";

export const authGuard: CanActivateFn = async (route, state) => {
  const msalService = inject(MsalService);
  const apiService = inject(ApiService);
  const router = inject(Router);
  const instance = msalService.instance;

  await instance.initialize();

  const redirectResult = await instance.handleRedirectPromise();
  if (redirectResult?.account) {
    instance.setActiveAccount(redirectResult.account);
  }

  let activeAccount = instance.getActiveAccount();
  if (!activeAccount && instance.getAllAccounts().length > 0) {
    activeAccount = instance.getAllAccounts()[0];
    instance.setActiveAccount(activeAccount);
  }

  if (activeAccount) {
    try {
      await firstValueFrom(apiService.getCurrentUser());
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 403) {
        return router.createUrlTree(['/access-denied']);
      }

      throw error;
    }
  }

  await instance.loginRedirect({
    scopes: [environment.entra.apiScope, 'openid', 'profile']
  });
  return false;
};
