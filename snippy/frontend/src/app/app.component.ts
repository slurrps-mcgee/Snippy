import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStoreService } from './shared/services/store.services/authStore.service';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Snippy';
  private authStoreService = inject(AuthStoreService);
}
