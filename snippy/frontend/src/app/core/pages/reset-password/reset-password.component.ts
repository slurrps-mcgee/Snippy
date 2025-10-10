import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../shared/services/api/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  form: FormGroup;
  token: string | null = null;
  loading = false;
  success: string | null = null;
  error: string | null = null;

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    });

    // extract token from query or fragment
    try {
      const url = new URL(window.location.href);
      this.token = url.searchParams.get('token');
      if (!this.token && location.hash) {
        const hashParams = new URLSearchParams(location.hash.slice(1));
        this.token = hashParams.get('token');
      }
    } catch (err) {
      // ignore
    }

    // remove token from URL to avoid it appearing in history
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search.replace(/([?&])token=[^&]*/, ''));
      if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (err) {
      // ignore
    }
  }

  async submit() {
    this.error = null;
    this.success = null;

    if (this.form.invalid) {
      this.error = 'Please provide a valid password (min 8 chars) and confirm it.';
      return;
    }

    const pw = this.form.get('password')!.value;
    const confirm = this.form.get('confirm')!.value;
    if (pw !== confirm) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (!this.token) {
      this.error = 'Missing reset token.';
      return;
    }

    this.loading = true;
    try {
      await this.api.request({ path: '/auth/reset', method: 'POST', body: { token: this.token, password: pw } }).toPromise();
      this.success = 'Password reset successful. You may now log in.';
      this.form.reset();
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to reset password';
    } finally {
      this.loading = false;
    }
  }
}
