import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStoreService } from '@app/services/stores/auth.store.service';
import { FooterComponent } from '@app/components/footer/footer.component';
import { PageHeaderComponent } from '@app/components/headers/page-header/page-header.component';

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
