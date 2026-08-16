import { Injectable, inject, signal } from '@angular/core';
import { BrokenCircuitError, isBrokenCircuitError } from 'cockatiel';
import { getRuntimeEnv } from '@app/config/runtime-env';
import { Api } from '@app/api/generated/api';
import { getHealth } from '@app/api/generated/functions';

@Injectable({ providedIn: 'root' })
export class MinioStatusService {
  private api = inject(Api);
  readonly enabled = signal(getRuntimeEnv().minio_enabled);

  constructor() {
    if (!this.enabled()) return;
    void this.api
      .invoke(getHealth)
      .then((res) => {
        if (res?.minio === false) this.disable();
      })
      .catch(() => {
        /* Probe failures must not latch off — API may be briefly unreachable. */
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
}
