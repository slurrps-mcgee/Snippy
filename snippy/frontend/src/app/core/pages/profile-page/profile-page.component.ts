import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api/api.service';
import { AuthLocalService } from '../../../shared/services/auth/auth.local.service';

@Component({
  selector: 'app-profile-page',
  imports: [],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  user: any;

  constructor(private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthLocalService) { }


  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.api.request({ path: '/users/' + params.get('username'), method: 'GET' }).subscribe({
        next: (response) => {
          this.user = response.user;
          console.log('API response:', response);
        },
        error: (error) => {
          console.error('API error:', error);
        }
      });
    });
  }

}


