import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, defer, from } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { defaultPolicy, HttpResiliencePolicy } from './resilience.service';
import { getRuntimeEnv } from '@app/config/runtime-env';

export type ApiOptions = {
    path: string; // path under api_base (e.g. /snippets/me)
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    policy?: HttpResiliencePolicy;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private readonly apiBase = getRuntimeEnv().api_base;

    request<T = any>(opts: ApiOptions): Observable<T> {
        const url = `${this.apiBase}${opts.path.startsWith('/') ? '' : '/'}${opts.path}`;
        const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
        const headers = isFormData
            ? undefined
            : new HttpHeaders(opts.headers || {});

        let params = new HttpParams();
        if (opts.params) {
            Object.keys(opts.params).forEach(k => {
                const v = opts.params![k];
                if (v !== undefined && v !== null) params = params.set(k, String(v));
            });
        }

        const method = (opts.method || 'GET').toUpperCase();
        const policy = opts.policy ?? defaultPolicy;

        // Create a fresh HttpClient call per attempt so cockatiel can retry failed responses
        const runOnce = () => {
            const options = headers ? { headers, params } : { params };
            switch (method) {
                case 'GET':
                    return firstValueFrom(this.http.get<T>(url, options));
                case 'POST':
                    return firstValueFrom(this.http.post<T>(url, opts.body, options));
                case 'PUT':
                    return firstValueFrom(this.http.put<T>(url, opts.body, options));
                case 'PATCH':
                    return firstValueFrom(this.http.patch<T>(url, opts.body, options));
                case 'DELETE':
                    return firstValueFrom(this.http.delete<T>(url, options));
                default:
                    return Promise.reject(new Error(`Unsupported method ${method}`));
            }
        };

        return defer(() => from(policy.execute(() => runOnce())));
    }
}
