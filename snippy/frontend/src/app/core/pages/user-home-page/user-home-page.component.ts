import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from '../../../shared/services/api/api.service';
import { AuthLocalService } from '../../../shared/services/auth/auth.local.service';
import { Subscription, of } from 'rxjs';

@Component({
  selector: 'app-user-home-page',
  imports: [],
  templateUrl: './user-home-page.component.html',
  styleUrl: './user-home-page.component.scss'
})
export class UserHomePageComponent implements OnInit, OnDestroy {
  user: any;
  private sub?: Subscription;

  constructor(
    public auth0: AuthService,
    private api: ApiService,
    private auth: AuthLocalService) {

    //log token only testing
    this.auth0.getAccessTokenSilently().subscribe(token => {
      console.log(token);
    });
  }

  // Subscribe to user info on init
  ngOnInit(): void {
    // Subscribe to the persisted user stream — this will emit as soon as
    // AuthLocalService saves the user after login and backend registration.
    this.sub = this.auth.user$.subscribe((u) => {
      if (u) {
        this.user = u;
        console.log('Received user from AuthLocalService:', u);
      } 
    });
  }

  // Cleanup subscription
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }


  //Test API call to get user info from backend
  getUser() {
    // get email from Auth0 profile
    this.api.request({ path: '/users', method: 'POST' }).subscribe({
      next: (response) => {
        this.user = response.user;
        console.log('API response:', response);
      },
      error: (error) => {
        console.error('API error:', error);
      }
    });
  }

}
