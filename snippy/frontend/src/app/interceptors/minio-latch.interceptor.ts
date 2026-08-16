import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MinioStatusService } from '@app/services/ui/minio-status.service';

function isMinioUrl(url: string, method: string): boolean {
  const m = method.toUpperCase();
  if (url.includes('/api/v1/assets')) return true;
  if (m === 'POST' && url.includes('/api/v1/users/picture')) return true;
  if (m === 'POST' && /\/api\/v1\/snippets\/[^/]+\/snapshot/.test(url)) return true;
  return false;
}

/** Latch MinIO off on 503 / open circuit for asset, picture, and snapshot calls. */
export const minioLatchInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isMinioUrl(request.url, request.method)) {
    return next(request);
  }

  const minio = inject(MinioStatusService);
  if (!minio.enabled()) {
    return throwError(() => ({ status: 503, message: 'MinIO unavailable' }));
  }

  return next(request).pipe(
    catchError((err) => {
      minio.disableIfMinioDown(err);
      return throwError(() => err);
    })
  );
};
