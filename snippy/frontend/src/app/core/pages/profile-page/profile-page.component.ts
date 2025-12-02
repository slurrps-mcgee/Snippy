import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-profile-page',
  imports: [],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  user?: User;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (!username) return;
      
      this.apiService.request<{ user: User }>({
        path: `/users/${username}`,
        method: 'GET'
      }).subscribe({
        next: (response) => {
          this.user = response.user;
        },
        error: (error) => {
          console.error('Failed to load user profile:', error);
        }
      });
    });
  }
}
