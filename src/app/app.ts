import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterOutlet,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { MATERIAL_IMPORTS } from './shared/material.imports';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, NgIf, AsyncPipe, ...MATERIAL_IMPORTS],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('linkplus');
  protected readonly auth = inject(AuthService);
  protected readonly loading = inject(LoadingService);
  private readonly router = inject(Router);

  async onLogout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  constructor() {
    // Global navigation spinner: show on navigation start, hide on end/cancel/error
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.loading.beginImmediate(120);
      } else if (
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      ) {
        this.loading.end();
      }
    });
  }
}
