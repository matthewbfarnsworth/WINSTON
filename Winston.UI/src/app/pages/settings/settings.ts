import { Component, inject } from '@angular/core';
import { PrimaryButton } from '../../components/primary-button/primary-button';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-settings',
  imports: [PrimaryButton],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private msalService = inject(MsalService);

  protected onLogout() {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:4200/login'
    })
  }
}