import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-home',
  imports: [CommonModule],
  templateUrl: './user-home.component.html',
  styleUrl: './user-home.component.scss'
})
export class UserHomeComponent {
  constructor(public auth: AuthService, private http: HttpClient) {

    // Example of getting an access token and making an authenticated request
    // this.auth.getAccessTokenSilently().subscribe(token => {
    //   console.log('Access Token:', token);

    //   // Example: call your backend with token
    //   this.http.get('http://localhost:3000/api/v1/invite/protected',
    //     { headers: { Authorization: `Bearer ${token}` } }
    //   ).subscribe({
    //     next: (response) => {
    //       console.log('HTTP Response:', response);
    //     },
    //     error: (error) => {
    //       console.error('HTTP Error:', error);
    //     }
    //   });
    // });

  }
}
