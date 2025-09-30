(function () {
    // placeholder to ensure module exists
})();

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalAuthService } from './auth.service';

export type ApiOptions = {
    path: string; // path under /api/v1
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
    private base: string;

    constructor(private http: HttpClient, private auth: LocalAuthService) {
        // Prefer runtime-injected env (assets/env.js sets window.__env) when available
        // window.__env is written by the container entrypoint at /assets/env.js
        const win: any = window as any;
        if (win && win.__env && win.__env.api_base) {
            this.base = win.__env.api_base;
        } else {
            // fallback used for local dev or when env.js isn't present
            this.base = 'http://localhost:3000/api/v1';
        }
    }

    request<T = any>(opts: ApiOptions): Observable<T> {
        const url = `${this.base}${opts.path.startsWith('/') ? '' : '/'}${opts.path}`;

        let headers = new HttpHeaders(opts.headers || {});
        const token = this.auth.getToken();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        let params = new HttpParams();
        if (opts.params) {
            Object.keys(opts.params).forEach(k => {
                const v = opts.params![k];
                if (v !== undefined && v !== null) params = params.set(k, String(v));
            });
        }

        const method = (opts.method || 'GET').toUpperCase();

        switch (method) {
            case 'GET':
                return this.http.get<T>(url, { headers, params });
            case 'POST':
                return this.http.post<T>(url, opts.body, { headers, params });
            case 'PUT':
                return this.http.put<T>(url, opts.body, { headers, params });
            case 'PATCH':
                return this.http.patch<T>(url, opts.body, { headers, params });
            case 'DELETE':
                return this.http.delete<T>(url, { headers, params });
            default:
                throw new Error(`Unsupported method ${method}`);
        }
    }
}