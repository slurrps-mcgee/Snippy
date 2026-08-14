import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { BrokenCircuitError, isBrokenCircuitError } from 'cockatiel';
import { getRuntimeEnv } from '@app/config/runtime-env';
import { ApiService } from '@app/services/api/api.service';

@Injectable({ providedIn: 'root' })
export class MinioStatusService {
  private api = inject(ApiService);
  readonly enabled = signal(getRuntimeEnv().minio_enabled);

  constructor() {
    if (!this.enabled()) return;
    this.api
      .request<{ status: string; minio?: boolean }>({ path: '/health', method: 'GET' })
      .subscribe({
        next: (res) => {
          if (res?.minio === false) this.disable();
        },
        error: () => {
          /* Probe failures must not latch off — API may be briefly unreachable. */
        },
      });
  }

  disable(): void {
    if (!this.enabled()) return;
    this.enabled.set(false);
    if (typeof window !== 'undefined' && window.__env) {
      window.__env.minio_enabled = false;
    }
  }

  disableIfMinioDown(err: unknown): void {
    if (isBrokenCircuitError(err) || err instanceof BrokenCircuitError) {
      this.disable();
      return;
    }
    const anyErr = err as { status?: number; statusCode?: number; response?: { status?: number } };
    const status = anyErr?.status ?? anyErr?.statusCode ?? anyErr?.response?.status;
    if (status === 503) this.disable();
  }

  /** Skip MinIO HTTP after latch; disable on 503 / open circuit. */
  latchOnError<T>(source: Observable<T>): Observable<T> {
    if (!this.enabled()) {
      return throwError(() => ({ status: 503, message: 'MinIO unavailable' }));
    }
    return source.pipe(
      catchError((err) => {
        this.disableIfMinioDown(err);
        return throwError(() => err);
      })
    );
  }
}
