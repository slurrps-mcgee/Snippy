import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { LocalAuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(
    private api: ApiService,
    private auth: LocalAuthService,
    private router: Router
  ) { }

  registerNewUser() {
    const payload = {
      email: 'newuser@example.com',
      password: 'MyStrongPassword123', // must meet server constraints
      // inviteCode: 'OPTIONAL_INVITE_CODE_IF_NEEDED'
    };

    this.api.request({
      path: '/auth/register',
      method: 'POST',
      body: payload
    }).subscribe({
      next: (res: any) => {
        // response shape: { success: true, data: { user, token } }
        const token = res?.data?.token;
        if (token) {
          this.auth.setToken(token);      // persist token in LocalAuthService
          // optional: save user in an app store or service
          this.router.navigate(['/user-home']); // or wherever
        } else {
          console.warn('No token in register response', res);
        }
        console.log('Registration successful', res);
      },
      error: (err) => {
        console.error('Registration failed', err);
        // show ui error message
      }
    });
  }
}
