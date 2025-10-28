import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly loading = inject(LoadingService);

  readonly user$: Observable<User | null> = authState(this.auth);
  readonly isLoggedIn$: Observable<boolean> = this.user$.pipe(map((u) => u !== null));
  readonly isAdmin$: Observable<boolean> = this.user$.pipe(
    map((u) => !!u && (!environment.adminEmail || u.email === environment.adminEmail))
  );

  async login(email: string, password: string) {
    this.loading.begin();
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } finally {
      this.loading.end();
    }
  }

  async logout() {
    this.loading.begin();
    try {
      return await signOut(this.auth);
    } finally {
      this.loading.end();
    }
  }
}
