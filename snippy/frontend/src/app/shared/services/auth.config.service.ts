import { Injectable } from '@angular/core';

@Injectable({
providedIn: 'root'
})
export class ConfigService {
private config: any;

load(): Promise<void> {
return fetch('/assets/appsettings.json')
.then(response => response.json())
.then(data => {
this.config = data;
});
}

// get auth0_domain(): string {
// return this.config?.auth0_domain;
// }

// get auth0_clientId(): string {
// return this.config?.auth0_clientId;
// }

// get api_baseURL(): string {
// return this.config?.api_baseURL;
// }
}