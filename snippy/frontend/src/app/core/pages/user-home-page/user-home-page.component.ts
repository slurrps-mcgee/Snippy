import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { AuthLocalService } from '../../../shared/services/auth.local.service';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-user-home-page',
  imports: [],
  templateUrl: './user-home-page.component.html',
  styleUrl: './user-home-page.component.scss'
})
export class UserHomePageComponent {
  user$!: ReturnType<typeof toSignal<User | null>>;

  constructor(
    public auth0Service: AuthService,
    private authLocalService: AuthLocalService
  ) {
    this.user$ = toSignal(this.authLocalService.user$, { initialValue: null });
  }
}
