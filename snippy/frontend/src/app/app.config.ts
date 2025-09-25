
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAuth0 } from '@auth0/auth0-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAuth0({
      //Change to use appsettings.json later
      domain: 'dev-4ev7py4uqxc7prli.us.auth0.com',
      clientId: 'n5bdvh7IGhMZ1AE69sPkQ3wzCUOhoWIj',
      authorizationParams: {
        audience: 'http://localhost:3000',
        redirect_uri: window.location.origin + '/userhome'    
      }
    })
  ]
};
