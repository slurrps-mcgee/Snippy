import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStoreService } from './shared/services/store.services/authStore.service';
import { FooterComponent } from './shared/components/footer/footer.component';
import { PageHeaderComponent } from './shared/components/headers/page-header/page-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, PageHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Snippy';
  private authStoreService = inject(AuthStoreService);
}
