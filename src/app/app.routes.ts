import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./shared/protected-home.component').then((m) => m.ProtectedHomeComponent),
      },
      // Future protected routes will go here (topics, print)
      { path: '**', redirectTo: '' },
    ],
  },
];
