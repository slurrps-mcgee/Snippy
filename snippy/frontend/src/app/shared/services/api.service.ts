import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { defaultPolicy } from './resiliance.service';

export type ApiOptions = {
    path: string; // path under /api/v1
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    // when true, wait for Auth0 to be authenticated before sending the request
    // requireAuth?: boolean;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private http: HttpClient, private auth: AuthService) {}
    
    // Generic API request method
    request<T = any>(opts: ApiOptions): Observable<T> {
        const url = `/api/v1${opts.path.startsWith('/') ? '' : '/'}${opts.path}`;

        // Use caller-provided headers but do not attach Authorization here.
        // Authorization is handled centrally by the HTTP interceptor.
        const headers = new HttpHeaders(opts.headers || {});

        let params = new HttpParams();
        if (opts.params) {
            Object.keys(opts.params).forEach(k => {
                const v = opts.params![k];
                if (v !== undefined && v !== null) params = params.set(k, String(v));
            });
        }

        const method = (opts.method || 'GET').toUpperCase();

        // defaultPolicy.execute returns a Promise/Observable that resolves to an Observable<T>;
        // flatten the inner Observable to return Observable<T>.
        return from(defaultPolicy.execute(async () => {
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
                    return throwError(() => new Error(`Unsupported method ${method}`));
            }
        })).pipe(
            switchMap(inner => inner)
        );
    }
}