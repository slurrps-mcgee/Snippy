import { Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStoreService } from '@app/services/stores/auth.store.service';
import { MinioStatusService } from '@app/services/ui/minio-status.service';
import { FooterComponent } from '@app/components/footer/footer.component';
import { PageHeaderComponent } from '@app/components/headers/page-header/page-header.component';
import { PreviewConsolePanelComponent } from '@app/components/editor/preview-console-panel/preview-console-panel.component';
import { HeaderMode } from '@app/interfaces/header-mode';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FooterComponent,
    PageHeaderComponent,
    PreviewConsolePanelComponent
],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Snippy';
  private authStoreService = inject(AuthStoreService);
  private minioStatus = inject(MinioStatusService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  headerMode: HeaderMode = 'landing';

  get isEmbedShell(): boolean {
    return this.headerMode === 'embed';
  }

  ngOnInit() {
    this.syncHeaderMode();
    void this.minioStatus.enabled();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncHeaderMode());
  }

  private syncHeaderMode() {
    let current: ActivatedRoute | null = this.route;
    while (current?.firstChild) current = current.firstChild;
    const fromData = current?.snapshot.data?.['header'] as HeaderMode | undefined;
    if (fromData) {
      this.headerMode = fromData;
      return;
    }
    const url = this.router.url.split('?')[0];
    if (url.startsWith('/embed/')) this.headerMode = 'embed';
    else if (url === '/' || url === '') this.headerMode = 'landing';
    else if (url === '/try' || url === '/snippet' || /\/snippet\//.test(url)) this.headerMode = 'editor';
    else if (/\/fullpage\//.test(url)) this.headerMode = 'minimal';
    else this.headerMode = 'feed';
  }
}
