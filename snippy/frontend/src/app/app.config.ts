import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthHttpInterceptor, provideAuth0 } from '@auth0/auth0-angular';
import { assertAuth0Env, getRuntimeEnv } from '@app/config/runtime-env';
import { provideDialogDefaults } from '@app/services/ui/dialog.service';

const env = getRuntimeEnv();
assertAuth0Env(env);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideDialogDefaults(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    provideAuth0({
      domain: env.auth0_domain,
      clientId: env.auth0_client_id,
      authorizationParams: {
        audience: env.auth0_audience,
        redirect_uri: window.location.origin + '/home'
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: '/api/*',
            allowAnonymous: true,
            tokenOptions: {
              authorizationParams: { audience: env.auth0_audience }
            }
          },
          {
            uri: '/api/v1/*',
            allowAnonymous: true,
            tokenOptions: { authorizationParams: { audience: env.auth0_audience } }
          }
        ]
      }
    })
  ]
};
