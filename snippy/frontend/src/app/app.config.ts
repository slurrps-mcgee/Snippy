import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { APIInterceptor } from './shared/services/api/api.interceptor';

const win: any = window as any;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    APIInterceptor,
    provideAuth0({
      domain: win.__env.auth0_domain,
      clientId: win.__env.auth0_client_id,
      authorizationParams: {
        audience: 'http://localhost:3000',
        redirect_uri: window.location.origin + '/userhome'
      }
    }),
  ]
};
