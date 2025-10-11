import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from '../../../shared/services/api/api.service';
import { AuthTokenService } from '../../../shared/services/auth/auth-token.service';
import { Subscription, of } from 'rxjs';

@Component({
  selector: 'app-user-home',
  imports: [CommonModule],
  templateUrl: './user-home.component.html',
  styleUrl: './user-home.component.scss'
})
export class UserHomeComponent implements OnInit, OnDestroy {
  user: any;
  private sub?: Subscription;

  constructor(
    public auth0: AuthService,
    private api: ApiService,
    private authToken: AuthTokenService
  ) {
    //log token only
    this.auth0.getAccessTokenSilently().subscribe(token => {
      console.log(token);
    });

    this.getUser();
  }

  ngOnInit(): void {
    // Subscribe to the persisted user stream — this will emit as soon as
    // AuthTokenService saves the user after login and backend registration.
    this.sub = this.authToken.user$.subscribe((u) => {
      if (u) {
        this.user = u;
        console.log('Received user from AuthTokenService:', u);
      } 
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

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