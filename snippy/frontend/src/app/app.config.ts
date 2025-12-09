import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthHttpInterceptor, provideAuth0 } from '@auth0/auth0-angular';

const win: any = window as any;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    provideAuth0({
      domain: win.__env.auth0_domain,
      clientId: win.__env.auth0_client_id,
      authorizationParams: {
        // default audience used for login/consent
        audience: win.__env.auth0_audience,
        redirect_uri: window.location.origin + '/home'
      },
      // Configure the HTTP interceptor so it knows which outgoing requests
      // should receive an Authorization header with an access token.
      httpInterceptor: {
        // match relative API calls proxied under /api or /api/v1
        allowedList: [
          // attach tokens to any call under /api
          {
            uri: '/api/*',
            tokenOptions: {
              // ensure the token is requested for the API audience
              authorizationParams: { audience: win.__env.auth0_audience }
            }
          },
          {
            uri: '/api/v1/*',
            tokenOptions: { authorizationParams: { audience: win.__env.auth0_audience } }
          }
        ]
      }
    })
  ]
};
