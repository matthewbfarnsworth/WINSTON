import { Component, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.css',
})
export class AccessDenied {
  private msalService = inject(MsalService);
  private apiService = inject(ApiService);

  protected requestEmail = signal('');
  private objectId = signal('');
  protected requestUrl = computed(() => {
    const requestEmail = this.requestEmail();
    if (!requestEmail) return '';

    const subject = encodeURIComponent('WINSTON access request');
    const body = encodeURIComponent(
      `Hi,\n\nPlease add my Microsoft account to the WINSTON allow-list.\n\nAccount ID: ${this.objectId()}`
    );

    return `mailto:${requestEmail}?subject=${subject}&body=${body}`;
  });

  constructor() {
    this.apiService.getAccessRequestInfo().subscribe({
      next: info => {
        this.requestEmail.set(info.requestEmail);
        this.objectId.set(info.objectId);
      },
      error: error => console.error('Failed to load access-request details', error),
    });
  }

  protected async onLogout() {
    await this.msalService.instance.initialize();
    await this.msalService.logoutRedirect({
      postLogoutRedirectUri: environment.entra.redirectUri,
    });
  }
}
