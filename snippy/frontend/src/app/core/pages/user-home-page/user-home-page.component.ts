
import { Component, OnInit, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from '../../../shared/services/api.service';
import { AuthLocalService } from '../../../shared/services/auth.local.service';
import { Subscription } from 'rxjs';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-user-home-page',
  imports: [],
  templateUrl: './user-home-page.component.html',
  styleUrl: './user-home-page.component.scss'
})
export class UserHomePageComponent implements OnInit, OnDestroy {
  private sub?: Subscription;
  user$!: ReturnType<typeof toSignal<User | null>>; // signal type

  constructor(
    public auth0Service: AuthService,
    private api: ApiService,
    private authLocalService: AuthLocalService) {

    //log token only testing
    this.auth0Service.getAccessTokenSilently().subscribe(token => {
      console.log(token);
    });

    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }

  // Subscribe to user info on init
  ngOnInit(): void {
  }

  // Cleanup subscription
  ngOnDestroy(): void {
  }
}
