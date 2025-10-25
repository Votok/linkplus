import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { MATERIAL_IMPORTS } from './shared/material.imports';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, NgIf, AsyncPipe, ...MATERIAL_IMPORTS],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('linkplus');
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async onLogout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
