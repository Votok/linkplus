import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { loginRedirectGuard } from './auth/login-redirect.guard';
import { unsavedChangesGuard } from './auth/unsaved-changes.guard';

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
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'grades/:gradeId/setup',
        loadComponent: () =>
          import('./grades/setup/grade-setup.component').then((m) => m.GradeSetupComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'grades/:gradeId/print',
        loadComponent: () =>
          import('./grades/print/grade-print.component').then((m) => m.GradePrintComponent),
      },
      {
        path: 'print',
        loadComponent: () => import('./print/print.component').then((m) => m.PrintComponent),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
