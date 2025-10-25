import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MATERIAL_IMPORTS } from '../shared/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Admin Login</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email" />
              <mat-error *ngIf="form.controls.email.hasError('required')"
                >Email is required</mat-error
              >
              <mat-error *ngIf="form.controls.email.hasError('email')">Invalid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                type="password"
                autocomplete="current-password"
              />
              <mat-error *ngIf="form.controls.password.hasError('required')"
                >Password is required</mat-error
              >
              <mat-error *ngIf="form.controls.password.hasError('minlength')"
                >Minimum 6 characters</mat-error
              >
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              class="full"
              [disabled]="form.invalid || loading"
            >
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      mat-card {
        width: min(420px, 100%);
      }
      .full {
        width: 100%;
      }
      form {
        display: grid;
        gap: 16px;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  loading = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.form.invalid || this.loading) return;
    const { email, password } = this.form.getRawValue();
    this.loading = true;
    try {
      await this.auth.login(email, password);
      await this.router.navigateByUrl('/');
      this.snack.open('Signed in', 'OK', { duration: 2000 });
    } catch (e: any) {
      const msg = this.errorMessage(e?.code) ?? 'Login failed';
      this.snack.open(msg, 'Dismiss', { duration: 4000 });
    } finally {
      this.loading = false;
    }
  }

  private errorMessage(code?: string): string | undefined {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      default:
        return undefined;
    }
  }
}
