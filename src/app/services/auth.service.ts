import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  readonly user$: Observable<User | null> = authState(this.auth);
  readonly isLoggedIn$: Observable<boolean> = this.user$.pipe(map((u) => !!u));
  readonly isAdmin$: Observable<boolean> = this.user$.pipe(
    map((u) => !!u && (!!environment.adminEmail ? u.email === environment.adminEmail : true))
  );

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }
}
