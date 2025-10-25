import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from './material.imports';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-protected-home',
  imports: [CommonModule, RouterLink, AsyncPipe, ...MATERIAL_IMPORTS],
  template: `
    <div class="container">
      <h2>Welcome</h2>
      <p>
        You are signed in as <strong>{{ (auth.user$ | async)?.email }}</strong
        >.
      </p>
      <p>This is a temporary protected page. We'll add Topics and Print next.</p>
      <div class="actions">
        <a mat-stroked-button color="primary" routerLink="/print">Go to Print</a>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 16px;
      }
      .actions {
        margin-top: 16px;
      }
    `,
  ],
})
export class ProtectedHomeComponent {
  readonly auth = inject(AuthService);
}
