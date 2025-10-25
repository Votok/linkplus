import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { environment } from '../../environments/environment';
import { firstValueFrom, take } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = await firstValueFrom(authState(auth).pipe(take(1)));
  if (!user) {
    return router.createUrlTree(['/login']);
  }
  if (environment.adminEmail && user.email !== environment.adminEmail) {
    return router.createUrlTree(['/login']);
  }
  return true;
};
