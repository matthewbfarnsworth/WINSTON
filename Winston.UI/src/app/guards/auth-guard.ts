import { inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { MsalService } from "@azure/msal-angular";

export const authGuard: CanActivateFn = async (route, state) => {
  const msalService = inject(MsalService);
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
    return true;
  }

  await instance.loginRedirect({
    scopes: ['user.read', 'openid', 'profile']
  });
  return false;
};