import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { loginRedirectGuard } from './auth/login-redirect.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginRedirectGuard],
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'topics' },
      {
        path: 'topics',
        loadComponent: () =>
          import('./topics/list/topics-list.component').then((m) => m.TopicsListComponent),
      },
      {
        path: 'topics/:id/edit',
        loadComponent: () =>
          import('./topics/editor/topic-editor.component').then((m) => m.TopicEditorComponent),
      },
      {
        path: 'print',
        loadComponent: () => import('./print/print.component').then((m) => m.PrintComponent),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
