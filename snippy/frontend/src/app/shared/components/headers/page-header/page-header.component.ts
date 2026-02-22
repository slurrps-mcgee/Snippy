import { Component, OnInit, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, NavigationEnd } from '@angular/router';
import { UserMenuComponent } from "../../modules/user-menu/user-menu.component";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-page-header',
  imports: [MatTabsModule, UserMenuComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent implements OnInit {

  private router = inject(Router);

  selectedPageIndex = 0;

  ngOnInit() {
    // Sync tab with current route on load
    this.updateTabFromRoute(this.router.url);

    // Update tab when route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateTabFromRoute(event.urlAfterRedirects);
      });
  }

  private updateTabFromRoute(url: string) {
    if (url.includes('/public')) {
      this.selectedPageIndex = 1;
    } else {
      this.selectedPageIndex = 0;
    }
  }

  onPageTabChange(index: number) {
    if (index === 0) {
      this.router.navigate(['/home']);
    } else if (index === 1) {
      this.router.navigate(['/public']);
    }
  }
}