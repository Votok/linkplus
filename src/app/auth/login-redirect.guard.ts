import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom, take } from 'rxjs';

// If already authenticated, redirect away from /login to /topics
export const loginRedirectGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = await firstValueFrom(authState(auth).pipe(take(1)));
  if (user) {
    return router.createUrlTree(['/topics']);
  }
  return true;
};
